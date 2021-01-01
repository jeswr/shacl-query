/* eslint-disable no-await-in-loop */
import ExtendedEngine from './engine';
import { Term } from 'rdf-js';

interface PathInterface {
  type: string;
  path: any;
  focus: boolean;
}

interface ListPath extends PathInterface {
  type: 'sequence' | 'alternate';
  path: Path[];
}

interface AtomPath extends PathInterface {
  type: 'zeroOrOne' | 'zeroOrMore';
  path: Path;
}

interface TermPath extends PathInterface {
  term: 'term';
  path: Term;
}

type Path = ListPath | AtomPath | TermPath;

// UUUUUUUUUUUUUUUUGH

// interface ExtractedPath {
//   path: any;
//   nested: ExtractedPath[];
// }

// TODO: (Unrelated) make drag-drop rdf package

// CURRENT DESIGN DECISION - each sh:node call is a separate extraction procedure
// OPTIONALLY add the collection of all objects related to a given subject so that we
// can verify the sh:closed property
// OPTIONALLY ADD ABILITY TO COLLECT CLASS INFO ETC FOR EACH NODE AS WELL

async function extractNodes(propertyNode: Term, engine: ExtendedEngine) {
  const res = await engine.getBoundResults(`SELECT DISTINCT ?r WHERE { <${propertyNode.value}> <http://www.w3.org/ns/shacl#node> ?r }`);
  return Promise.all(res.map((node) => extractProperties(node, engine)));
}

async function extractPath(term: Term, engine: ExtendedEngine, propertyFocus = false): Promise<Path> {
  if (term.termType === 'NamedNode') {
    return {
      type: 'path',
      propertyFocus,
      branches: [{
        type: 'atom',
        term,
        zeroOrMore: false,
        zeroOrOne: false
      }]
    }
  } else if (term.termType === 'BlankNode') {
    const res = await engine.query(`SELECT DISTINCT ?r ?o WHERE { <${term.value}> ?r ?o }`);
    if (res.type !== 'bindings') {
      throw new Error('Bindings expected')
    }
    const bindings = await res.bindings();
    if (bindings.length === 1) { // This is one of the sh:____path predicates
      const predicate = bindings[0].get('?r')
      const path = extractPath(bindings[0].get('?o'), engine)
      if (predicate.termType !== 'NamedNode') {
        throw new Error('Named Node Expected')
      }
      switch (predicate.value) {
        // This one we need to add ? on the actual query so that
        case 'http://www.w3.org/ns/shacl#zeroOrOnePath':
          return {
            type: 'path',
            branches: [{
              type: 'atom',
              term: await path,
              zeroOrMore: false,
              zeroOrOne: true
            }],
            propertyFocus
          }
        case 'http://www.w3.org/ns/shacl#oneOrMorePath':
          return {
            type: 'path',
            branches: [{
              type: 'atom',
              term: await path,
              zeroOrMore: false,
              zeroOrOne: false
            }]


            path: {
              type: 'atom',
              term: await path,
              zeroOrMore: false,
              zeroOrOne: false
            },
            branches: [{
              type: 'path',
              path: {
                type: 'atom',
                term: await path,
                zeroOrMore: true,
                zeroOrOne: false
              },
              propertyFocus: false
            }],
            propertyFocus
          }
        case 'http://www.w3.org/ns/shacl#zeroOrMorePath':
          return {
            type: 'path',
            path: {
              type: 'atom',
              term: await path,
              zeroOrMore: true,
              zeroOrOne: false
            },
            propertyFocus
          }
        case 'http://www.w3.org/ns/shacl#alternativePath':
        case 'http://www.w3.org/ns/shacl#inversePath':
        default:
          throw new Error(`Invalid shacl path type ${predicate[0].value}`);
      }
    }

    if (predicate.length === 1 && predicate[0].termType === 'NamedNode') {
      // This is one of the sh:____path predicates
      switch (predicate[0].value) {
        // This one we need to add ? on the actual query so that
        case 'http://www.w3.org/ns/shacl#zeroOrOnePath':
          return { path: { term, zeroOrMore: false, zeroOrOne: true }, propertyFocus }
        case 'http://www.w3.org/ns/shacl#oneOrMorePath':
          return { path: { term, zeroOrMore: false, zeroOrOne: false }, propertyFocus }
        case 'http://www.w3.org/ns/shacl#zeroOrMorePath':
          return { path: { term, zeroOrMore: true, zeroOrOne: false }, propertyFocus }
        case 'http://www.w3.org/ns/shacl#alternativePath':
        case 'http://www.w3.org/ns/shacl#inversePath':
        default:
          throw new Error(`Invalid shacl path type ${predicate[0].value}`);
      }
    } else if (predicate.length === 2) {
      // This is a list and hence a sequential path
      let tempName = name;
      const list = await engine.getList(path);
      for (const elem of list) {
        addPath(elem, tempName, generator, engine);
        tempName = `?${generator.next().value}`;
      }
    } else {
      throw new Error('Invalid path');
    }
    return {};
  }

  export async function extractProperties(node: Term, engine: ExtendedEngine): ExtractedPath {
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
    const properties = res.bindingsStream.map(async (result) => {
      const property = extractNodes(result.get('?property'), engine);
      const path = extractPath(result.get('?path'), engine);
      return {
        path: await path,
        nested: await property,
      };
    });

    const bindings = await res.bindings();

    const paths = res.map((pred) => {
      const res = await engine.getBoundResults(`
PREFIX sh: <http://www.w3.org/ns/shacl#> .
SELECT DISTINCT ?r WHERE { 
  <${node.value}> (sh:not|sh:and|sh:or|sh:xone)*/sh:property ?r 
}`);
    });
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
