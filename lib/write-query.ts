/* eslint-disable import/no-extraneous-dependencies */
import { Map } from 'immutable';
import {
  Factory, toSparql, translate, Util, Algebra, Algebra, Algebra,
} from 'sparqlalgebrajs';
import { namedNode, quad, variable } from '@rdfjs/data-model';
import { BaseQuad, Variable } from 'n3';
import { remove } from 'ramda';
import { Term } from 'rdf-js';
import { Path } from './types';
// import factory from 'sparqlalgebrajs/lib/factory';
?s ?p ?o .
  	VALUES (?p) { (rdfs:label) }

// ex:p1/ex:p2 -> SUBJECT ex:p1 ?v0 . ?v0 ex:p2 ?v1
// ex:p1|ex:p2 -> 
OPTIONAL
BIND
UNION


function getPatterns(op: Algebra.LeftJoin | Algebra.Bgp | Algebra.Union | Algebra.Extend | Algebra.Join): Algebra.Pattern[] {
  if (op.type === 'bgp') {
    return op.patterns;
  } if (op.type === 'leftjoin' || op.type === 'union' || op.type === 'join') {
    return [...getPatterns(op.input.left), ...getPatterns(op.input.right)];
  }
  throw new Error('Expected pattern or left join');
}

function toConstructAlgebra(op: Algebra.LeftJoin | Algebra.Bgp, factory = new Factory()) {
  return factory.createConstruct(op, getPatterns(op));
}

function createAlternative() {

}

function createConstructPattern(path: Path, subject: Term, object: Term, nextVar: () => Variable, pathUpTo: Path): Algebra.Pattern | Algebra.Union | Algebra.Extend | Algebra.Join {
  const factory = new Factory();
  // IF FOCUS - ADD OPTIONAL { {subject} ?p ?o }
  switch (path.type) {
    case 'alternate': {
      if (path.path.length < 1) {
        throw new Error('Expected alternate path length to be >= 1')
      }
      const [p, ...rest] = path.path
      let pattern = createConstructPattern(p, subject, object, nextVar);
      for (const elem of rest) {
        pattern = factory.createUnion(pattern, createConstructPattern(elem, subject, object, nextVar));
      }
      return pattern;
    }
    case 'inverse': {
      return createConstructPattern(path.path, object, subject, nextVar)
    }
    case 'sequence': {
      if (path.path.length < 1) {
        throw new Error('Expected sequence path length to be >= 1')
      }
      let tempSubject = subject;
      let seq = createConstructPattern(path.path[0], tempSubject, tempSubject = nextVar(), nextVar);
      for (let i = 1; i < path.path.length - 1; i += 1) {
        seq = factory.createJoin(seq, createConstructPattern(path.path[i], tempSubject, tempSubject = nextVar(), nextVar))
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
      return factory.createPattern(
        lastVariable,
        path.path,
        variable('?o'),
        null,
      );
    }
    case 'zeroOrOne': {
      const variable = nextVar();
      return factory.createExtend(
        createConstructPattern(path, subject, variable, nextVar),
        variable,
        factory.createTermExpression(subject),
      )
    }
    default:
      throw new Error(`Invalid path type ${path}`);
  }
}

export default function writeQuery(path: Path, counters: Map<string, number>): string {
  const factory = new Factory();
  // factory.createLeftJoin(
  //   factory.createOpera
  // )

  const pattern1 = factory.createPattern(
    namedNode('http://a1'),
    namedNode('http://a2'),
    namedNode('http://a3'),
  );

  const pattern = factory.createPattern(
    namedNode('http://1'),
    namedNode('http://2'),
    namedNode('http://3'),
  );

  // console.log(JSON.stringify(translate('CONSTRUCT { ?s ?p ?o } WHERE { ?a ?b ?c . OPTIONAL { ?s ?p ?o } }'), null, 2))
  // factory.createAdd

  const optional = factory.createLeftJoin(
    factory.createBgp([pattern1]),
    factory.createBgp([pattern]),
  );

  const operation = factory.createConstruct(
    optional,
    // factory.createBgp([
    //   pattern,
    //   pattern,
    // ]),
    [pattern, pattern],
  );

  // const operator = factory.createLeftJoin(pattern, pattern);
  // const optional = {
  //   type: 'optional',
  //   patterns: [
  //     pattern,
  //   ],
  // };

  // const operator = factory.createProject(
  //   factory.createOperatorExpression('SELECT', [
  //     factory.createTermExpression(
  //       quad(
  //         namedNode('http://example.org/myShape'), namedNode('http://'), variable('?o'),
  //       ),
  //     ),
  //   ]),
  //   [],
  // );
  // const operator = factory.createOperatorExpression('optional', [
  //   pattern
  // ]);
  return toSparql(operation);
}

console.log(writeQuery({
  type: 'term',
  path: namedNode('http://example.org/myPath'),
  focus: true,
}, Map()));
