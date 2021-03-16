/* eslint-disable no-undef */
import { namedNode } from '@rdfjs/data-model';
import { Parser } from 'n3';
import * as fs from 'fs';
import path from 'path';
import { extractProperties } from '../lib/basic-extract';
import { Path } from '../lib/types';
import { Simple, TwoProperties } from './quads';
import { quadsToEngine } from './utils';

describe('Extracting paths of basic Node Shapes', () => {
  it('Should convert a basic shape to a construct query', async () => {
    const engine = quadsToEngine(Simple());

    expect(await extractProperties(namedNode('http://example.org/myShape'), engine)).toEqual({
      focus: true,
      path: namedNode('http://example.org/myPath'),
      type: 'term',
    });
  });

  it('Should convert a basic shape to a construct query', async () => {
    const engine = quadsToEngine(TwoProperties());

    const p: Path = {
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
    };

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

describe('Testing extraction on shacl-shacl', () => {
  const parser = new Parser();
  const quads = parser.parse(fs.readFileSync(path.join(__dirname, 'files', 'shacl-shacl.ttl')).toString());
  const engine = quadsToEngine(quads);
  const shapeShape = namedNode('http://www.w3.org/ns/shacl-shacl#ShapeShape');
  it('The SHACL SHACL shape should extract the SHACL SHACL shape', async () => {
    const extracted = await extractProperties(shapeShape, engine);
    console.log(JSON.stringify(extracted, null, 2));
  });
});
