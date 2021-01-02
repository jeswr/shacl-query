/* eslint-disable no-use-before-define */
/* eslint-disable no-await-in-loop */
import { Term } from 'rdf-js';
import arrayifyStream from 'arrayify-stream';
import ExtendedEngine from './utils/engine';
import { Path } from './types';

// interface ExtractedPath {
//   path: any;
//   nested: ExtractedPath[];
// }

// TODO: (Unrelated) make drag-drop rdf package

// CURRENT DESIGN DECISION - each sh:node call is a separate extraction procedure
// OPTIONALLY add the collection of all objects related to a given subject so that we
// can verify the sh:closed property
// OPTIONALLY ADD ABILITY TO COLLECT CLASS INFO ETC FOR EACH NODE AS WELL

async function extractPath(path: Term, engine: ExtendedEngine, focus = false): Promise<Path> {
  if (path.termType === 'NamedNode') {
    return {
      type: 'term',
      path,
      focus,
    };
  } if (path.termType === 'BlankNode') {
    const res = await engine.query(`SELECT DISTINCT ?r ?o WHERE { <${path.value}> ?r ?o }`);
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
          return {
            type: 'alternate',
            path: await Promise.all((await engine.getList(bindings[0].get('?o'))).map((pth) => extractPath(pth, engine))),
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
        path: await Promise.all((await engine.getList(bindings[0].get('?o'))).map((p) => extractPath(p, engine))),
        focus,
      };
    }
  }
  throw new Error('Invalid path');
}

export async function extractProperties(node: Term, engine: ExtendedEngine): Promise<Path> {
  // Be carefule of recursive property shapes
  const res = await engine.query(`
PREFIX sh: <http://www.w3.org/ns/shacl#> .
SELECT DISTINCT ?property ?path WHERE { 
  <${node.value}> (sh:not|sh:and|sh:or|sh:xone)*/sh:property ?property .
                  ?property sh:path ?path .
}`);
  if (res.type !== 'bindings') {
    throw new Error('Expected bindings of length 1');
  }

  const properties = res.bindingsStream.map(async (result): Promise<Path> => {
    const path = extractPath(result.get('?path'), engine);
    const nodes = await extractNodes(result.get('?property'), engine);
    if (nodes.length > 0) {
      return {
        type: 'sequence',
        path: [await path, {
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
    const array: Path[] = [];
    properties.on('data', (d: Path) => {
      array.push(d);
    });
    properties.on('end', () => {
      resolve({
        type: 'alternate',
        path: array,
        focus: true, // Think this should be only focus and rest are set to false?
      });
    });
    properties.on('error', (e) => {
      reject(e);
    });
  });
}

async function extractNodes(propertyNode: Term, engine: ExtendedEngine) {
  const res = await engine.getBoundResults(`SELECT DISTINCT ?r WHERE { <${propertyNode.value}> <http://www.w3.org/ns/shacl#node> ?r }`);
  return Promise.all(res.map((node) => extractProperties(node, engine)));
}

/**
 * This is a basic extraction algorithm for *nodeShapes*
 */
export default async function basicExtract(node: Term, engine: ExtendedEngine) {
  const res = await engine.getBoundResults(`
PREFIX sh: <http://www.w3.org/ns/shacl#> .
SELECT DISTINCT ?r WHERE { 
  <${node.value}> (sh:not|sh:and|sh:or|sh:xone)*/sh:property ?r 
}`);

  // const res = await engine.getBoundResults(`SELECT DISTINCT ?r WHERE { <${node.value}> <http://www.w3.org/ns/shacl#property> ?r }`);

  // for (const result of res) {
  //   // TODO: Handling of paths *inside* logical modifiers
  //   const path = await engine.getBoundResults(`SELECT DISTINCT ?r WHERE { <${node.value}> <http://www.w3.org/ns/shacl#path> ?r }`);
  //   // if (result.termType === 'NamedNode') {

  //   // } else if (result.value) {

  //   // }
  // }

  // const triples = [];
  // if (path.termType === 'NamedNode') {
  //   triples.push({
  //     triple: [name, `<${path.value}>`, generator.next().value],
  //     optional: false, // If this is set to true then OPTIONAL { /* triple */ } is used
  //   });
  // } else if (path.termType === 'BlankNode') {
  //   const predicate = await engine.getBoundResults(`SELECT DISTINCT ?r WHERE { <${path.value}> ?r ?o }`);
  //   if (predicate.length === 1 && predicate[0].termType === 'NamedNode') {
  //     // This is one of the sh:???path predicates
  //     switch (predicate[0].value) {
  //       // This one we need to add ? on the actual query so that
  //       case 'http://www.w3.org/ns/shacl#zeroOrOnePath':
  //         return `?${path}`;
  //       case 'http://www.w3.org/ns/shacl#oneOrMorePath':
  //       case 'http://www.w3.org/ns/shacl#zeroOrMorePath':
  //       case 'http://www.w3.org/ns/shacl#alternativePath':
  //       case 'http://www.w3.org/ns/shacl#inversePath':
  //       default:
  //         throw new Error(`Invalid shacl path type ${predicate[0].value}`);
  //     }
  //   } else if (predicate.length === 2) {
  //     // This is a list and hence a sequential path
  //     let tempName = name;
  //     const list = await engine.getList(path);
  //     for (const elem of list) {
  //       addPath(elem, tempName, generator, engine);
  //       tempName = `?${generator.next().value}`;
  //     }
  //   } else {
  //     throw new Error('Invalid path');
  //   }

  //   // // TODO: Handle all other path types - atm this just works for sequence
  //   // const list = await engine.getList(path)
  // } else {
  //   throw new Error('Expected blank node *or* named node');
  // }
}
