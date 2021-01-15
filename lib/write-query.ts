import { Map } from 'immutable';
import { Term, Variable } from 'rdf-js';
import { Algebra, Factory } from 'sparqlalgebrajs';
import { varGenerator } from './utils';
import { pathHash } from './path-hash';
import { Path } from './types';

type ConstructComponent =
  | Algebra.LeftJoin
  | Algebra.Bgp
  | Algebra.Union
  | Algebra.Extend
  | Algebra.Pattern
  | Algebra.Join;

function getPatterns(op: ConstructComponent):
  Algebra.Pattern[] {
  if (op.type === 'bgp') {
    return op.patterns;
  } if (op.type === 'leftjoin' || op.type === 'union' || op.type === 'join') {
    return [...getPatterns(op.input.left), ...getPatterns(op.input.right)];
  } if (op.type === 'pattern') {
    return [op];
  } if (op.type === 'extend') {
    // TODO: Remove nasty type casting here
    return getPatterns(op.input as ConstructComponent);
  }
  const r: null = op;
  throw new Error('Expected pattern or left join');
}

function toConstructAlgebra(op: ConstructComponent, factory = new Factory()) {
  return factory.createConstruct(op, getPatterns(op));
}

function createConstructPattern(
  path: Path,
  subject: Term,
  object: Term,
  pathUpTo: Path | undefined,
  counterMap: Map<string, number> = Map(),
  collectFocusDetail = true,
  fallbackCount?: number,
  nextVar: (() => Variable) = varGenerator(),
):
  ConstructComponent {
  const factory = new Factory();
  if (path.focus && collectFocusDetail) {
    // TODO
  }
  // IF FOCUS - ADD OPTIONAL { {subject} ?p ?o }
  switch (path.type) {
    case 'alternate': {
      if (path.path.length < 1) {
        throw new Error('Expected alternate path length to be >= 1');
      }
      const [p, ...rest] = path.path;
      let pattern = createConstructPattern(
        p, subject, object, pathUpTo, counterMap, collectFocusDetail, fallbackCount, nextVar,
      );
      for (const elem of rest) {
        pattern = factory.createUnion(pattern,
          createConstructPattern(
            elem, subject, object, pathUpTo, counterMap, collectFocusDetail, fallbackCount, nextVar,
          ));
      }
      return pattern;
    }
    case 'inverse': {
      return createConstructPattern(path.path, object, subject,
        // TODO: Fix his case - probably need reverse flag
        pathUpTo,
        counterMap, collectFocusDetail, fallbackCount, nextVar);
    }
    case 'sequence': {
      if (path.path.length < 1) {
        throw new Error('Expected sequence path length to be >= 1');
      }
      let tempSubject = subject;
      let seq = createConstructPattern(
        path.path[0],
        tempSubject,
        tempSubject = nextVar(),
        pathUpTo,
        counterMap,
        collectFocusDetail,
        fallbackCount,
        nextVar,
      );
      for (let i = 1; i < path.path.length - 1; i += 1) {
        seq = factory.createJoin(seq, createConstructPattern(
          path.path[i],
          tempSubject,
          tempSubject = nextVar(),
          pathUpTo,
          counterMap,
          collectFocusDetail,
          fallbackCount,
          nextVar,
        ));
      }
      return seq;
    }
    case 'term': {
      return factory.createPattern(
        subject,
        path.path,
        object,
      );
    }
    case 'zeroOrMore': {
      const counter = counterMap.get(pathHash({ path: pathUpTo, zeroOrMore: path.path }))
      ?? fallbackCount;
      if (counter === undefined) {
        throw new Error('Counter is undefined and no fallback is provided');
      }
      let variable = nextVar();
      let p: Algebra.Extend | Algebra.LeftJoin = factory.createExtend(
        createConstructPattern(
          path, subject, variable, pathUpTo, counterMap, collectFocusDetail, fallbackCount, nextVar,
        ),
        variable,
        factory.createTermExpression(subject),
      );
      for (let i = 0; i <= counter; i += 1) {
        variable = nextVar();
        p = factory.createLeftJoin(p, factory.createExtend(
          createConstructPattern(
            path,
            subject,
            variable,
            pathUpTo,
            counterMap,
            collectFocusDetail,
            fallbackCount,
            nextVar,
          ),
          variable,
          factory.createTermExpression(subject),
        ));
      }
      return p;
    }
    case 'zeroOrOne': {
      const variable = nextVar();
      return factory.createExtend(
        createConstructPattern(
          path, subject, variable, pathUpTo, counterMap, collectFocusDetail, fallbackCount, nextVar,
        ),
        variable,
        factory.createTermExpression(subject),
      );
    }
    default:
      throw new Error(`Invalid path type ${path}`);
  }
}

export default function pathToConstructQuery(
  path: Path,
  subject: Term,
  counterMap: Map<string, number>,
  collectFocusDetail?: boolean,
  fallbackCount?: number,
) {
  const generator = varGenerator();
  const pattern = createConstructPattern(
    path, subject, generator(), undefined, counterMap, collectFocusDetail, fallbackCount, generator,
  );
  return toConstructAlgebra(pattern);
}
