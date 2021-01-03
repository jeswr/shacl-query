/* eslint-disable no-undef */
import { quad, namedNode, blankNode } from '@rdfjs/data-model';
import { Store } from 'n3';
import { extractProperties } from '../lib/basic-extract';
import QueryEngine from './query-engine';
import ExtendedEngine from '../lib/utils/engine';

describe('Extracting paths of basic Node Shapes', () => {
  it('Should convert a basic shape to a construct query', async () => {
    const store = new Store();
    store.addQuads([
      quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), namedNode('http://www.w3.org/ns/shacl#NodeShape')),
      quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/ns/shacl#property'), blankNode('1')),
      quad(blankNode('1'), namedNode('http://www.w3.org/ns/shacl#path'), namedNode('http://example.org/myPath')),
    ]);
    const engine = new ExtendedEngine(new QueryEngine([store]));

    expect(await extractProperties(namedNode('http://example.org/myShape'), engine)).toEqual({
      focus: true,
      path: namedNode('http://example.org/myPath'),
      type: 'term',
    });
  });

  it('Should convert a basic shape to a construct query', async () => {
    const store = new Store();
    store.addQuads([
      quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), namedNode('http://www.w3.org/ns/shacl#NodeShape')),
      quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/ns/shacl#property'), blankNode('1')),
      quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/ns/shacl#property'), blankNode('2')),
      quad(blankNode('1'), namedNode('http://www.w3.org/ns/shacl#path'), namedNode('http://example.org/myPath/1')),
      quad(blankNode('2'), namedNode('http://www.w3.org/ns/shacl#path'), namedNode('http://example.org/myPath/2')),
    ]);
    const engine = new ExtendedEngine(new QueryEngine([store]));

    expect(await extractProperties(namedNode('http://example.org/myShape'), engine)).toEqual({
      focus: true,
      path: [{
        type: 'term',
        path: namedNode('http://example.org/myPath/1'),
        focus: true,
      }, {
        type: 'term',
        path: namedNode('http://example.org/myPath/2'),
        focus: true,
      }],
      type: 'alternate',
    });
  });
});
