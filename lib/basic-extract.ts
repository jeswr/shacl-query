/* eslint-disable no-case-declarations */
/* eslint-disable no-use-before-define */
/* eslint-disable no-await-in-loop */
import { Term } from 'rdf-js';
import ExtendedEngine from './utils/engine';
import { Path } from './types';

async function extractPath(path: Term, engine: ExtendedEngine, focus = false): Promise<Path> {
  if (path.termType === 'NamedNode') {
    return {
      type: 'term',
      path,
      focus,
    };
  } if (path.termType === 'BlankNode') {
    const res = await engine.query(`SELECT DISTINCT ?r ?o WHERE { <${
      // @ts-ignore
      path.skolemized?.value ?? path.value}> ?r ?o }`);
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
          return {
            type: 'zeroOrOne',
            path: await extractPath(bindings[0].get('?o'), engine),
            focus,
          };
        case 'http://www.w3.org/ns/shacl#oneOrMorePath':
          // eslint-disable-next-line no-case-declarations
          const p = await extractPath(bindings[0].get('?o'), engine);
          return {
            type: 'sequence',
            path: [
              p,
              { type: 'zeroOrMore', path: p, focus },
            ],
            focus,
          };
        case 'http://www.w3.org/ns/shacl#zeroOrMorePath':
          return { type: 'zeroOrMore', path: await extractPath(bindings[0].get('?o'), engine), focus };
        case 'http://www.w3.org/ns/shacl#alternativePath':
          const pt = await Promise.all((await engine.getList(bindings[0].get('?o'))).map((pth) => extractPath(pth, engine)));
          return {
            type: 'alternate',
            path: pt,
            focus,
          };
        case 'http://www.w3.org/ns/shacl#inversePath':
          return {
            type: 'inverse',
            path: await extractPath(bindings[0].get('?o'), engine),
            focus,
          };
        default:
          throw new Error(`Invalid shacl path type ${predicate.value}`);
      }
    } else if (bindings.length === 2) {
      // This is a list and hence a sequential path
      return {
        type: 'sequence',
        path: await Promise.all((await engine.getList(path)).map((p) => extractPath(p, engine))),
        focus,
      };
    }
  }
  throw new Error('Invalid path');
}

export async function extractProperties(node: Term, engine: ExtendedEngine): Promise<Path> {
  // Be carefule of recursive property shapes
  // @ts-ignore
  const q = `
PREFIX sh: <http://www.w3.org/ns/shacl#>
SELECT DISTINCT ?property ?path WHERE { 
  <${
  // @ts-ignore
  node.skolemized?.value ?? node.value}> (sh:not|sh:and|sh:or|sh:xone)*/sh:property ?property .
  ?property sh:path ?path .
}`;

  const res = await engine.query(q);

  if (res.type !== 'bindings') {
    throw new Error('Expected bindings of length 1');
  }
  const properties = res.bindingsStream.map(async (result): Promise<Path> => {
    // TODO: Remove this await once finished debugging
    const path = await extractPath(result.get('?path'), engine);
    const nodes = await extractNodes(result.get('?property'), engine);
    if (nodes.length > 0) {
      return {
        type: 'sequence',
        path: [path, {
          type: 'alternate',
          path: nodes,
          focus: false, // TODO: Double check
        }],
        focus: false, // TODO: Double Check this
      };
    }
    return path;
  });
  return new Promise((resolve, reject) => {
    const array: Promise<Path>[] = [];
    properties.on('data', (d: Promise<Path>) => {
      array.push(d);
    });
    properties.on('end', async () => {
      resolve({
        type: 'alternate',
        path: await Promise.all(array),
        focus: true, // Think this should be only focus and rest are set to false?
      });
    });
    properties.on('error', (e) => {
      reject(e);
    });
  });
}

async function extractNodes(propertyNode: Term, engine: ExtendedEngine) {
  // TODO: Remove when finished debugging
  // @ts-ignore
  const q = `SELECT ?r WHERE { <${propertyNode.skolemized?.value ?? propertyNode.value}> <http://www.w3.org/ns/shacl#node> ?r }`;
  const res = await engine.getBoundResults(q);
  return Promise.all(res.map((node) => extractProperties(node, engine)));
}

/**
 * This is a basic extraction algorithm for *nodeShapes*
 */
export async function basicExtract(node: Term, engine: ExtendedEngine) {
  const res = await engine.getBoundResults(`
PREFIX sh: <http://www.w3.org/ns/shacl#>
SELECT DISTINCT ?r WHERE { 
  <${
  // @ts-ignore
  node.skolemized?.value ?? node.value}> (sh:not|sh:and|sh:or|sh:xone)*/sh:property ?r 
}`);
}
