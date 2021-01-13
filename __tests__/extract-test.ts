/* eslint-disable no-undef */
import { namedNode } from '@rdfjs/data-model';
import { extractProperties } from '../lib/basic-extract';
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
