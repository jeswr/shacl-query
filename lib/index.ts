import { Generator } from 'sparqljs';
import { namedNode, quad, variable } from '@rdfjs/data-model';
import { Term, NamedNode } from 'rdf-js';
import { IQueryResult } from '@comunica/actor-init-sparql';
import type { queryEngine } from './types';
import { generateVar } from './utils/variable-generator';
import ExtendedEngine from './utils/engine';

// Note that closed and ignoredProperties do not affect the behavior of this library

// THIS MODULE SHOULD WORK *WITHOUT* ANY INFERENCED DATA ABOUT THE CONSTRAINT
// TODO: Just steal tfle
// This library *is not* responsible for performing *validation*
// of the shape - and assumes that a *valid* NodeShape is being passed
// into the function [use anther lib to do this first]
// Furthermore we assume that the shape is *already* from a skolemized source,
// if this is note the case use the shape-shape to extract the shape
// TODO: CHANGE TYPE OF FOCUS NODE TO NamedNode | NamedNode[]

/**
   *
   * @param term term for the path
   * @param name the name of the variable/named node
   */
async function addPath(path: Term, name: string, generator: Generator, engine: ExtendedEngine, paths: Term[], mappings: Record<string, number>) {
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

export async function ShapeToSPARQL(shapeEngine: queryEngine, nodeShape: NamedNode, focusNode: NamedNode) {
  const engine = new ExtendedEngine(shapeEngine);

  const generator = generateVar();
  const currentVar = `<${focusNode.value}>`;
  const node = nodeShape;

  // The issue with rdf:list is more generally an issue with any path that is not restricted to finite length
  // ie sh:path ( sh:ignoredProperties [ sh:zeroOrMorePath rdf:rest ] rdf:first ) ;
  // This is another issue that we have (in addition to nested shapes)
  // Thought -> send an *initial* query that collects the length of such path and then adds the OPTIONAL {}
  // to the query - atm this may be a reasonable option
  // TODO: Handle logic extraction
  const triples: { triple: [string, string, string], optional: boolean }[] = [];

  const res = await getBoundResults(`SELECT DISTINCT ?r WHERE { <${node.value}> <http://www.w3.org/ns/shacl#property> ?r }`);
  for (const property of res) {
    const path = await getSingle(`SELECT DISTINCT ?r WHERE { <${property.value}> <http://www.w3.org/ns/shacl#path> ?r }`);
    addPath(path, currentVar);
  }

  // Thinking about the issue of recursion - obviously we *may* need to break up the query
  // so each *nested* NodeShape should be its *own* query

  // for (const property of properties) {
  //   const path = await shapeEngine.query(`SELECT ?path WHERE { <${property}> <http://www.w3.org/ns/shacl#path> ?path } `)
  //   if (path.type === 'b')
  //   const or = await shapeEngine.query(`SELECT ?or WHERE { <${property}> <http://www.w3.org/ns/shacl#or> ?or } `)
  //   const and = await shapeEngine.query(`SELECT ?and WHERE { <${property}> <http://www.w3.org/ns/shacl#and> ?and } `)
  //   const xone = await shapeEngine.query(`SELECT ?xone WHERE { <${property}> <http://www.w3.org/ns/shacl#xone> ?xone } `)
  //   console.log(path)
  // }

  // for ()
  // return properties

  const internal = triples.map((data) => {
    const { optional, triple } = data;
    const tripleString = triple.join(' ');
    return optional ? `OPTIONAL { ${tripleString} }` : tripleString;
  }).join(' .\n  ');

  return `CONSTRUCT {\n  ${internal} .\n} WHERE {\n ${internal} .\n}`;
}

/**
 * Internal select count
 */
export function parseCollectLengthBindings(res: IQueryResult): Record<string, number> {
  if (res.type !== 'bindings') {
    throw new Error('Bindings expected');
  }
  const bindings = await res.bindings();
  if (bindings.length !== 1) {
    throw new Error('Invalid length collection - result should be of length 1');
  }
  const [binding] = bindings;

  const result: Record<string, number> = {};
  // TODO: Clean up this section - think there is issue with type def of bindings
  const obj = binding.toObject();
  for (const key of Object.keys(obj)) {
    const term = obj[key];
    if (term.termType === 'Variable') {
      const value = Number(term.value);
      if (Number.isInteger(value)) {
        result[key] = value;
      } else {
        throw new Error(`Binding for key ${key} needs to be an integer, not ${value}`);
      }
    } else {
      throw new Error(`Binding for key ${key} needs to be a variable, not a ${term.termType}`);
    }
  }
  return result;
}

// TODO: Add immutability where appropriate
/**
 * This function is used to extract the *maximum length* of queries involving
 * variable length paths.
 *
 * Sample use case: extracting a list from a data source that *does not* skolemize
 * blank nodes. In this case we need to extract the whole list in a single query *and*
 * we should mainitain order. Without recursion - or knowing the length of the path beforehand
 * to hardcode the path length into the SPARQL query - this *cannot* be done.
 */
function collectLengths(shapeEngine: queryEngine, nodeShape: NamedNode, focusNode: NamedNode): Record<string, number> {
  async function getBoundResults(query: string) {
    const res = await shapeEngine.query(query);
    if (res.type !== 'bindings') {
      throw new Error('Bindings expected');
    }
    return res;
  }
}
