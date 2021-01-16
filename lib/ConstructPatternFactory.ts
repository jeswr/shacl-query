import { Map } from 'immutable';
import { Term, Variable } from 'rdf-js';
import { Algebra, Factory, toSparql } from 'sparqlalgebrajs';
import { namedNode } from '@rdfjs/data-model';
import { varGenerator } from './utils';
import { pathHash } from './path-hash';
import { Path } from './types';

export type ConstructComponent =
  | Algebra.LeftJoin
  | Algebra.Bgp
  | Algebra.Union
  | Algebra.Extend
  | Algebra.Pattern
  | Algebra.Join;

export function mapAndApplyPairwise<T, K>(f: (i: T) => K, g: (l: K, r: K) => K, input: T[]) {
  if (input.length < 1) {
    throw new Error('Expected length to be >= 1');
  }
  let value = f(input[0]);
  for (let i = 1; i < input.length; i += 1) {
    value = g(value, f(input[i]));
  }
  return value;
}

function getPatterns(op: ConstructComponent):
  Algebra.Pattern[] {
  if (op.type === 'bgp') {
    return op.patterns;
  } if (op.type === 'leftjoin' || op.type === 'union' || op.type === 'join') {
    return [...getPatterns(op.left as ConstructComponent),
      ...getPatterns(op.right as ConstructComponent)];
  } if (op.type === 'pattern') {
    return [op];
  } if (op.type === 'extend') {
    // TODO: Remove nasty type casting here
    return getPatterns(op.input as ConstructComponent);
  }
  const r: null = op;
  throw new Error('Expected pattern or left join');
}

export default class ConstructPatternFactory {
  private factory = new Factory();

  private nextVar = varGenerator();

  private counters: Map<string, number>;

  private focusDetail: boolean;

  private fallbackCount: number | undefined;

  constructor(
    counters: Map<string, number> = Map(),
    focusDetail = true,
    fallbackCount?: number,
  ) {
    this.counters = counters;
    this.focusDetail = focusDetail;
    this.fallbackCount = fallbackCount;
  }

  private getCounter(path: { path?: Path; zeroOrMore: Path; }): number {
    const counter = this.counters.get(pathHash(path)) ?? this.fallbackCount;
    if (counter === undefined) {
      throw new Error('Counter is undefined and no fallback is provided');
    }
    return counter;
  }

  public createConstructPattern(
    path: Path,
    subject: Term,
    object: Variable = this.nextVar(),
    pathHistory: Path | undefined = undefined,
    inverse: boolean = false,
  ): ConstructComponent {
    if (path.focus && this.focusDetail) {
      // TODO
    }
    const createExtend = (p: Path): Algebra.Extend | Algebra.Join | Algebra.LeftJoin => {
      const variable = this.nextVar();
      return this.factory.createExtend(
        this.createConstructPattern(p, subject, variable, pathHistory, inverse),
        object,
        this.factory.createTermExpression(variable),
      );
    };

    switch (path.type) {
      case 'alternate':
        return mapAndApplyPairwise(createExtend, this.factory.createJoin, path.path);
      case 'inverse':
        return this.createConstructPattern(path.path, subject, object, pathHistory, !inverse);
      case 'sequence': {
        if (path.path.length < 1) {
          throw new Error('Expected length to be >= 1');
        }
        let pth = path.path;
        if (inverse) {
          pth = pth.reverse();
        }
        let tempSub = subject;
        let tempObj = pth.length === 1 ? object : this.nextVar();
        let seq = this.createConstructPattern(pth[0], tempSub, tempObj, pathHistory, inverse);
        for (let i = 1; i < pth.length; i += 1) {
          tempSub = tempObj;
          tempObj = i === pth.length - 1 ? object : this.nextVar();
          seq = this.factory.createJoin(
            seq,
            this.createConstructPattern(pth[i], tempSub, tempObj, pathHistory, inverse),
          );
        }
        return seq;
      }
      case 'term': {
        return this.factory.createPattern(
          inverse ? object : subject,
          path.path,
          inverse ? subject : object,
        );
      }
      case 'zeroOrMore': {
        const vars: Variable[] = [];
        const count = this.getCounter({ path: pathHistory, zeroOrMore: path.path });
        for (let i = 0; i <= count; i += 1) {
          vars.push(this.nextVar());
        }
        let tempSub = subject;
        let variable = this.nextVar();
        let seq: ConstructComponent = this.createConstructPattern(
          path.path, vars[count], vars[count + 1], pathHistory, inverse,
        );

        for (let i = 1; i < count; i += 1) {
          tempSub = variable;
          variable = (i === count - 1) ? object : this.nextVar();
          seq = this.factory.createLeftJoin(
            this.createConstructPattern(
              path.path, vars[count - i], vars[count - i + 1], pathHistory, inverse
            ), seq,
          );
        }
        return seq;
      }
      case 'zeroOrOne': {
        const variable = this.nextVar();
        return this.factory.createExtend(
          this.createConstructPattern(path.path, subject, variable, pathHistory, inverse),
          variable,
          this.factory.createTermExpression(subject),
        );
      }
      default:
        throw new Error('Invalid');
    }
  }

  public toConstructAlgebra(op: ConstructComponent) {
    return this.factory.createConstruct(op, getPatterns(op));
  }

  public pathToConstructQuery(
    path: Path,
    subject: Term,
  ) {
    const pattern = this.createConstructPattern(
      path, subject,
    );
    return this.toConstructAlgebra(pattern);
  }
}

const myFactory = new ConstructPatternFactory(Map(), false, 4);

const toTerm = (t: string): Path => ({
  type: 'term',
  path: namedNode(t),
  focus: true,
});

const thePath: Path = {
  focus: true,
  path: [
    toTerm('http://example.org/myPath/1'),
    toTerm('http://example.org/myPath/2'),
  ],
  type: 'alternate',
};

const mySequence: Path = {
  type: 'sequence',
  path: [thePath, thePath, thePath],
  focus: false,
};

const myZeroOrOne: Path = {
  type: 'zeroOrMore',
  path: toTerm('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'),
  focus: false,
};

console.log(toSparql(myFactory.pathToConstructQuery({
  focus: true,
  path: [
    toTerm('http://list'),
    myZeroOrOne,
    toTerm('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'),
  ],
  type: 'sequence',
}, namedNode('http://Jesse'))));
