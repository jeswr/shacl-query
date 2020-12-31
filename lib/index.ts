import { Generator } from 'sparqljs';
import { namedNode, quad, variable } from '@rdfjs/data-model';
import { Term, NamedNode } from 'rdf-js';

import type { queryEngine } from './types'
import { generateVar } from './variable-generator'
import { IQueryResult } from '@comunica/actor-init-sparql';

// THIS MODULE SHOULD WORK *WITHOUT* ANY INFERENCED DATA

// TODO: Just steal tfle

// This library *is not* responsible for performing *validation*
// of the shape - and assumes that a *valid* NodeShape is being passed
// into the function
// Furthermore we assume that the shape is *already* from a skolemized source,
// if this is note the case use the shape-shape to extract the shape
// TODO: CHANGE TYPE OF FOCUS NODE TO NamedNode | NamedNode[]
export async function ShapeToSPARQL(shapeEngine: queryEngine, nodeShape: NamedNode, focusNode: NamedNode) {
  
  async function getBoundResults(query: string): Promise<Term[]> {
    const res = await shapeEngine.query(query)
    if (res.type !== 'bindings') {
      throw new Error('Bindings expected')
    }
    const bindings = (await res.bindings()).map(binding => binding.get('?r'))
    for (const binding of bindings) {
      if ('skolemized' in binding) {
        // @ts-ignore
        binding.value = binding.skolemized.value
      } 
    }
    return bindings
  }

  // Used for queries where exactly one object is expected
  async function getSingle(query: string): Promise<Term> {
    const res = await getBoundResults(query)
    if (res.length !== 1) {
      throw new Error('Exactly one object expected for query: ' + query)
    }
    return res[0];
  }

  // Extracts an rdf:list
  async function getList(term: Term): Promise<Term[]> {
    let tempTerm = term
    const result: Term[] = []
    while (!(tempTerm.termType === 'NamedNode' && tempTerm.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil')) {
      result.push(await getSingle(`SELECT DISTINCT ?r WHERE { <${tempTerm.value}> <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> ?r }`))
      tempTerm = await getSingle(`SELECT DISTINCT ?r WHERE { <${tempTerm.value}> <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> ?r }`)
    }
    return result;
  }
    
  let generator = generateVar();
  let currentVar = '<' + focusNode.value + '>';
  let node = nodeShape;
  
  // The issue with rdf:list is more generally an issue with any path that is not restricted to finite length
  // ie sh:path ( sh:ignoredProperties [ sh:zeroOrMorePath rdf:rest ] rdf:first ) ;
  // This is another issue that we have (in addition to nested shapes)
  // Thought -> send an *initial* query that collects the length of such path and then adds the OPTIONAL {} 
  // to the query - atm this may be a reasonable option
  // TODO: Handle logic extraction
  const triples: { triple: [string, string, string], optional: boolean }[] = []
  const res = await getBoundResults(`SELECT DISTINCT ?r WHERE { <${node.value}> <http://www.w3.org/ns/shacl#property> ?r }`);
  for (const property of res) {
    const paths = await getBoundResults(`SELECT DISTINCT ?r WHERE { <${property.value}> <http://www.w3.org/ns/shacl#path> ?r }`);
    if (paths.length === 1) {
      const [path] = paths;
      if (path.termType === 'NamedNode') {
        // TODO: Fix this
        triples.push({
          triple: [currentVar, '<' + path.value + '>', currentVar = '?' + generator.next().value],
          optional: false // If this is set to true then OPTIONAL { /* triple */ } is used
        })
      } else if (path.termType === 'BlankNode') {
        const predicate = await getBoundResults(`SELECT DISTINCT ?r WHERE { <${path.value}> ?r ?o }`);
        // TODO: Handle all other path types - atm this just works for sequence
        const list = await getList(path)
        console.log(list)
      } else {
        throw new Error('Expected blank node *or* named node')
      }
    } else {
      throw new Error('Path predicate should have exactly one object')
    }
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

  const internal = triples.map(data => {
    const { optional, triple } = data
    const tripleString = triple.join(' ')
    return optional ? `OPTIONAL { ${tripleString} }` : tripleString
  }).join(' .\n  ')
  
  return `CONSTRUCT {\n  ${internal} .\n} WHERE {\n ${internal} .\n}`
}


/**
 * Internal select count
 */
export function parseCollectLengthBindings(res: IQueryResult): Record<string, number> {
  if (res.type !== 'bindings') {
    throw new Error('Bindings expected')
  }
  const bindings = await res.bindings()
  if (bindings.length !== 1) {
    throw new Error('Invalid length collection - result should be of length 1')
  }
  const [binding] = bindings;

  const result: Record<string, number> = {}
  // TODO: Clean up this section - think there is issue with type def of bindings
  const obj = binding.toObject()
  for (const key of Object.keys(obj)) {
    const term = obj[key]
    if (term.termType === 'Variable') {
      const value = Number(term.value)
      if (Number.isInteger(value)) {
        result[key] = value;
      } else {
        throw new Error(`Binding for key ${key} needs to be an integer, not ${value}`)
      }
    } else {
      throw new Error(`Binding for key ${key} needs to be a variable, not a ${term.termType}`)
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
    const res = await shapeEngine.query(query)
    if (res.type !== 'bindings') {
      throw new Error('Bindings expected')
    }
    return res
  }



  // SELECT (MAX(?internalCount1) as ?c1) (MAX(?internalCount2) as ?c2) WHERE {
  //   {
  //   SELECT (COUNT(?b) as ?internalCount1) WHERE { 
  //    <http://example.org/humanWikidataShape> <http://www.w3.org/ns/shacl#property>/<http://www.w3.org/ns/shacl#in>* ?a . ?a rdf:rest+ ?b
  //   }
  //   }
    
  //   {
  //   SELECT (COUNT(?b) as ?internalCount2) WHERE { 
  //    <http://example.org/humanWikidataShape> <http://www.w3.org/ns/shacl#property>* ?a . ?a <http://www.w3.org/ns/shacl#property>+ ?b
  //   }
  //   }
    
  //   }


  // zeroOrMore
  // oneOrMore

  // for *now* performance is a *low* priority

  // GENERAL QUERY FORMAT
  // SELECT (MAX(?count) as ?c1) WHERE {
  //   SELECT ?a (COUNT(?b) as ?count) WHERE { 
  //    <http://example.org/humanWikidataShape> <http://www.w3.org/ns/shacl#property>/<http://www.w3.org/ns/shacl#in>* ?a .
  //    ?a rdf:rest+ ?b
  //   }
  //   }


// SELECT ?c WHERE { 
// <http://example.org/humanWikidataShape> <http://www.w3.org/ns/shacl#property>/<http://www.w3.org/ns/shacl#in> ?a .
//  ?a rdf:rest* ?b BIND(COUNT(?b) as ?c)
}


  // SELECT (MAX(?c) as ?count) WHERE { ?r ?a ?s 
  //   { 
  //   SELECT (COUNT(?o) as ?c) WHERE { ?s rdf:rest*/rdf:first ?o } } 
  //   }
  
  
  
  const repeats: Record<string, number> = {};



  return {};
}


  // : any, focusNode: Term) {
  // for await (const property of shape.property) {
  //   const path = await property.path;
  // }
// }

// const generator = new Generator({});
// generator.createGenerator();
