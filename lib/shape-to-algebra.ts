/* eslint-disable prefer-const */
import { Term } from 'rdf-js';
import { Factory, Algebra } from 'sparqlalgebrajs';
import { ExtendedEngine } from './utils';

async function pathToAlgebra(path: Term, engine: ExtendedEngine, focus = false):
Promise<Algebra.PropertyPathSymbol> {
  const factory = new Factory();
  if (path.termType === 'NamedNode') {
    return factory.createTermExpression(path);
  } if (path.termType === 'BlankNode') {
    const res = await engine.query(
      // @ts-ignore
      `SELECT DISTINCT ?r ?o WHERE { <${path.skolemized?.value ?? path.value}> ?r ?o }`,
    );
    if (res.type !== 'bindings') {
      throw new Error('Bindings expected');
    }
    const bindings = await res.bindings();
    if (bindings.length === 1) { // This is one of the sh:____path predicates
      const predicate = bindings[0].get('?r');
      if (predicate.termType !== 'NamedNode') {
        throw new Error('Named Node Expected');
      }
      switch (predicate.value) {
        // This one we need to add ? on the actual query so that
        case 'http://www.w3.org/ns/shacl#zeroOrOnePath':
          return factory.createZeroOrOnePath(await pathToAlgebra(bindings[0].get('?o'), engine));
        case 'http://www.w3.org/ns/shacl#oneOrMorePath':
          return factory.createOneOrMorePath(await pathToAlgebra(bindings[0].get('?o'), engine));
        case 'http://www.w3.org/ns/shacl#zeroOrMorePath':
          return factory.createZeroOrMorePath(await pathToAlgebra(bindings[0].get('?o'), engine));
        case 'http://www.w3.org/ns/shacl#alternativePath': {
          let [p, ...rest]: Algebra.PropertyPathSymbol[] = await Promise.all(
            (await engine.getList(bindings[0].get('?o'))).map((pth) => pathToAlgebra(pth, engine))
          );
          for (const elem of rest) {
            p = factory.createAlt(p, elem);
          }
          return p;
        }
        case 'http://www.w3.org/ns/shacl#inversePath':
          return factory.createInv(await pathToAlgebra(bindings[0].get('?o'), engine));
        default:
          throw new Error(`Invalid shacl path type ${predicate.value}`);
      }
    } else if (bindings.length === 2) {
      let [p, ...rest]: Algebra.PropertyPathSymbol[] = await Promise.all(
        (await engine.getList(path)).map((pt) => pathToAlgebra(pt, engine)),
      );
      for (const elem of rest) {
        p = factory.createSeq(p, elem);
      }
      return p;
    }
  }
  throw new Error('Invalid path');
}

function algebraOperation(path: Algebra.PropertyPathSymbol) {
  path.type
}
