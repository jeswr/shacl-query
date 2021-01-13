/* eslint-disable no-undef */
import { namedNode } from '@rdfjs/data-model';
import { NamedNode, Quad } from 'rdf-js';
import { extractProperties } from '../lib/basic-extract';
import { simplify } from '../lib/simplify-statements';
import { getCountersQuery } from '../lib/getCounters';
import * as QuadData from './quads';
import { quadsToEngine } from './utils';
import processCount from '../lib/process-count';
import { ExtendedEngine } from '../lib/utils';

async function run(
  shaclEngine: ExtendedEngine,
  dataEngine: ExtendedEngine,
  shacl: NamedNode,
  node: NamedNode,
) {
  const properties = await extractProperties(shacl, shaclEngine);
  const simplifiedProperties = simplify(properties);
  const counterQuery = getCountersQuery(simplifiedProperties, node);
  if (!counterQuery) {
    return false;
  }
  const counterBindings = await dataEngine.query(counterQuery);
  const processedCounters = processCount(counterBindings);
  return processedCounters;
}

async function runFromQuads(
  shaclEngine: Quad[],
  dataEngine: Quad[],
  shacl: NamedNode,
  node: NamedNode,
) {
  return run(quadsToEngine(shaclEngine), quadsToEngine(dataEngine), shacl, node);
}

describe('Testing that the correct counts are produced for the dataset', () => {
  it('Should produce the correct no counts for SeqAlt on JesseData', async () => {
    const mappings = await runFromQuads(
      QuadData.SeqAlt(),
      QuadData.JesseData(),
      namedNode('http://example.org/myShape'),
      namedNode('http://example.org/JESSE'),
    );
    expect(mappings).toEqual(false);
  });
  it('Should produce the correct no counts for Simple on JesseData', async () => {
    const mappings = await runFromQuads(
      QuadData.Simple(),
      QuadData.JesseData(),
      namedNode('http://example.org/myShape'),
      namedNode('http://example.org/JESSE'),
    );
    expect(mappings).toEqual(false);
  });
  it('Should produce the correct no counts for SeqZmore on JesseData', async () => {
    const mappings = await runFromQuads(
      QuadData.SeqZmore(),
      QuadData.JesseData(),
      namedNode('http://example.org/myShape'),
      namedNode('http://example.org/JESSE'),
    );
    expect(mappings).not.toEqual(false);
    if (mappings) {
      expect(mappings.get('dc9838df354e914781795ee124726934')).toEqual(0);
    }
  });
  it('Should produce the correct no counts for SeqZmore on JesseData', async () => {
    const mappings = await runFromQuads(
      QuadData.SeqZmore(),
      QuadData.JesseNoTypeData(),
      namedNode('http://example.org/myShape'),
      namedNode('http://example.org/JESSE'),
    );
    expect(mappings).not.toEqual(false);
    if (mappings) {
      expect(mappings.get('dc9838df354e914781795ee124726934')).toEqual(0);
    }
  });
});

// (async () => {
//   // const simplified = simplify(await extractProperties(namedNode('http://example.org/myShape'), engine));
//   // const ts = getCountersQuery(simplified, namedNode('http://example/JESSE'));

//   const simplified3 = simplify(await extractProperties(namedNode('http://example.org/myShape'), engine3));
//   const ts3 = getCountersQuery(simplified3, namedNode('http://example.org/JESSE'));

//   if (!ts3) {
//     throw new Error('Expected counter query to be defined');
//   }

//   const result = await dataEngine3.query(ts3);
//   if (result.type !== 'bindings') {
//     throw new Error('Expected Bindings');
//   }
//   const bindings = await result.bindings();
//   if (bindings.length !== 1) {
//     throw new Error('Expected bindings to have length 1');
//   }

//   console.log(
//     JSON.stringify(
//       simplified3,
//       null,
//       2,
//     ),
//   );
//   console.log(ts3);
//   console.log(bindings[0].get('?0977f4744562aa9c884013b5682b5f7b'));
//   console.log(bindings[0].get('?4692d873e275648ee36990eaebf15ac6'));
//   console.log(bindings[0].get('?9bdbc8e3172113bf17d1621ca958193c'));
// })();
