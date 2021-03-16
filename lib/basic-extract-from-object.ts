/* eslint-disable no-case-declarations */
/* eslint-disable no-use-before-define */
/* eslint-disable no-await-in-loop */
import { Term } from 'rdf-js';
import { RdfObjectLoader, Resource } from 'rdf-object';
import { RdfObjectProxy, AnyResource } from 'rdf-object-proxy';
import * as sh from '@ontologies/shacl';
import ExtendedEngine from './utils/engine';
import { Path } from './types';
import { namedNode } from '@rdfjs/data-model';

function create<T extends Path['type'], K extends Path['path']>(type: T, path: K, focus = false) {
  return { type, path, focus };
}

function extractPath(path: Resource, focus = false): Path {
  switch (path.term.termType) {
    case 'NamedNode':
      return create('term', path.term, focus);
    case 'BlankNode': {
      // eslint-disable-next-line guard-for-in
      for (const property in path.property) {
        switch (property) {
          case sh.zeroOrOnePath.value:
            return create('zeroOrOne', extractPath(path.property[property]));
          case sh.zeroOrMorePath.value:
            return create('zeroOrMore', extractPath(path.property[property]));
          case sh.inversePath.value:
            return create('inverse', extractPath(path.property[property]));
          case sh.alternativePath.value:
            return create('alternate',
              path.property[property].list?.map((p) => extractPath(p)) ?? []);
          case sh.oneOrMorePath.value: {
            const term = extractPath(path.property[property]);
            return create('sequence', [term, create('zeroOrMore', term)]);
          }
          default:
            return create('sequence', path.list?.map((p) => extractPath(p)) ?? []);
        }
      }
      throw new Error('Invalid path');
    }
    default:
      throw new Error('Invalid path');
  }
}

export function extractShape(node: Resource) {
  if (node.isA(namedNode('http://www.w3.org/ns/shacl#NodeShape'))) {
    node.not
  }
  if (node.isA(namedNode('http://www.w3.org/ns/shacl#PropertyShape'))) {
    
  }
  throw new Error('Invalid shape: Should be Node Shape or Property Shape')
}




















export async function extractProperties(node: Term, engine: ExtendedEngine): Promise<Path> {
  // Be carefule of recursive property shapes
  // @ts-ignore
  const q = `
PREFIX sh: <http://www.w3.org/ns/shacl#>
SELECT DISTINCT ?property ?path WHERE { 
  <${
  // TODO: FIX - Need distinction between listed and nots
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

async function extractNodes(node: Resource) {
  node.
  
  
  
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
