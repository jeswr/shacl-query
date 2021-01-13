/* eslint-disable no-undef */
import { newEngine as fileEngine } from '@comunica/actor-init-sparql-file';
import { namedNode } from '@rdfjs/data-model';
import { ShapeToSPARQL } from '../lib';
import QueryEngine from './utils/query-engine';
import { Simple } from './quads';
import { quadsToEngine } from './utils';

describe('Producing CONSTRUCT queries from in-memory shapes', () => {
  const engine = quadsToEngine(Simple());

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
