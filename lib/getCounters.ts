/* eslint-disable no-await-in-loop */
import { Term } from 'rdf-js';
import ExtendedEngine from './utils/engine';

/**
 * This function is used to collect all the paths
 * that we need to run the count query for
 */
export default async function getCounters(node: Term, engine: ExtendedEngine) {


  
  const res = await engine.getBoundResults(`SELECT DISTINCT ?r WHERE { <${node.value}> <http://www.w3.org/ns/shacl#property> ?r }`);

  for (const result of res) {
    // TODO: Handling of paths *inside* logical modifiers
    const path = await engine.getBoundResults(`SELECT DISTINCT ?r WHERE { <${node.value}> <http://www.w3.org/ns/shacl#path> ?r }`);
    // if (result.termType === 'NamedNode') {

    // } else if (result.value) {

    // }
  }

  const triples = [];
  if (path.termType === 'NamedNode') {
    triples.push({
      triple: [name, `<${path.value}>`, generator.next().value],
      optional: false, // If this is set to true then OPTIONAL { /* triple */ } is used
    });
  } else if (path.termType === 'BlankNode') {
    const predicate = await engine.getBoundResults(`SELECT DISTINCT ?r WHERE { <${path.value}> ?r ?o }`);
    if (predicate.length === 1 && predicate[0].termType === 'NamedNode') {
      // This is one of the sh:???path predicates
      switch (predicate[0].value) {
        // This one we need to add ? on the actual query so that
        case 'http://www.w3.org/ns/shacl#zeroOrOnePath':
          return `?${path}`;
        case 'http://www.w3.org/ns/shacl#oneOrMorePath':
        case 'http://www.w3.org/ns/shacl#zeroOrMorePath':
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

    // // TODO: Handle all other path types - atm this just works for sequence
    // const list = await engine.getList(path)
  } else {
    throw new Error('Expected blank node *or* named node');
  }
}
