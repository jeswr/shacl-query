/* eslint-disable no-undef */
import { Store } from 'n3';
import { newEngine } from '@comunica/actor-init-sparql-rdfjs';
import { newEngine as fileEngine } from '@comunica/actor-init-sparql-file';
import { blankNode, namedNode, quad } from '@rdfjs/data-model';
import type { ActorInitSparql } from '@comunica/actor-init-sparql';
import { ShapeToSPARQL } from '../lib';
import QueryEngine from './query-engine';

describe('Producing CONSTRUCT queries from in-memory shapes', () => {
  const store = new Store();
  store.addQuads([
    quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), namedNode('http://www.w3.org/ns/shacl#NodeShape')),
    quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/ns/shacl#property'), blankNode('1')),
    quad(blankNode('1'), namedNode('http://www.w3.org/ns/shacl#path'), namedNode('http://example.org/myPath')),
  ]);

  const engine = new QueryEngine([store]);
  it('Should convert a basic shape to a construct query', async () => {
    expect(await ShapeToSPARQL(engine, namedNode('http://example.org/myShape'), namedNode('http://example.org/Jesse'))).toEqual(
      'CONSTRUCT { <http://example.org/Jesse> <http://example.org/myPath> ?a } WHERE { <http://example.org/Jesse> <http://example.org/myPath> ?a }',
    );
  });
});

describe('Producing CONSTRUCT queries from file based shapes', () => {
  const engine = new QueryEngine(['__tests__/files/shacl-shacl.ttl'], fileEngine());
  it('Should convert a basic shape to a construct query', async () => {
    expect(await ShapeToSPARQL(engine, namedNode('http://www.w3.org/ns/shacl-shacl#ShapeShape'), namedNode('http://example.org/Jesse'))).toEqual('');
  });
  // TODO
});

describe('Testing that the *results* of the construct queries are as expected', () => {
  // TODO
});
