import { quad, namedNode, blankNode } from '@rdfjs/data-model';
import { Store } from 'n3';
import { extractProperties } from '../lib/basic-extract';
import QueryEngine from './query-engine';
import ExtendedEngine from '../lib/utils/engine';
import { simplify } from '../lib/simplify-statements';
import { getCountersQuery } from '../lib/getCounters';

const store = new Store();
store.addQuads([
  quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), namedNode('http://www.w3.org/ns/shacl#NodeShape')),
  quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/ns/shacl#property'), blankNode('1')),
  quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/ns/shacl#property'), blankNode('2')),
  quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/ns/shacl#property'), blankNode('3')),
  quad(blankNode('1'), namedNode('http://www.w3.org/ns/shacl#path'), namedNode('http://example.org/myPath/1')),
  quad(blankNode('2'), namedNode('http://www.w3.org/ns/shacl#path'), namedNode('http://example.org/myPath/2')),
  quad(blankNode('3'), namedNode('http://www.w3.org/ns/shacl#path'), blankNode('4')),
  quad(blankNode('4'), namedNode('http://www.w3.org/ns/shacl#alternativePath'), blankNode('5')),
  quad(blankNode('5'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), namedNode('http://example.org/myPath/3-1')),
  quad(blankNode('5'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), blankNode('6')),
  quad(blankNode('6'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), blankNode('10')),
  quad(blankNode('6'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), blankNode('7')),
  quad(blankNode('7'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), namedNode('http://example.org/myPath/3-2')),
  quad(blankNode('7'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil')),
  quad(blankNode('10'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), namedNode('http://example.org/myPath/4-1')),
  quad(blankNode('10'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), blankNode('11')),
  quad(blankNode('11'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), namedNode('http://example.org/myPath/4-2')),
  quad(blankNode('11'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil')),
]);
const engine = new ExtendedEngine(new QueryEngine([store]));

const store2 = new Store();
store2.addQuads([
  quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), namedNode('http://www.w3.org/ns/shacl#NodeShape')),
  quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/ns/shacl#property'), blankNode('1')),
  quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/ns/shacl#property'), blankNode('2')),
  quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/ns/shacl#property'), blankNode('3')),
  quad(blankNode('1'), namedNode('http://www.w3.org/ns/shacl#path'), namedNode('http://example.org/myPath/1')),
  quad(blankNode('2'), namedNode('http://www.w3.org/ns/shacl#path'), namedNode('http://example.org/myPath/2')),
  quad(blankNode('3'), namedNode('http://www.w3.org/ns/shacl#path'), blankNode('4')),
  quad(blankNode('4'), namedNode('http://www.w3.org/ns/shacl#zeroOrMorePath'), namedNode('http://example.org/myPath/3')),
]);
const engine2 = new ExtendedEngine(new QueryEngine([store2]));

const store3 = new Store();
store3.addQuads([
  quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), namedNode('http://www.w3.org/ns/shacl#NodeShape')),
  quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/ns/shacl#property'), blankNode('1')),
  quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/ns/shacl#property'), blankNode('2')),
  quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/ns/shacl#property'), blankNode('3')),
  quad(blankNode('1'), namedNode('http://www.w3.org/ns/shacl#path'), namedNode('http://example.org/myPath/1')),
  quad(blankNode('2'), namedNode('http://www.w3.org/ns/shacl#path'), namedNode('http://example.org/myPath/2')),
  quad(blankNode('3'), namedNode('http://www.w3.org/ns/shacl#path'), blankNode('4')),
  quad(blankNode('4'), namedNode('http://www.w3.org/ns/shacl#alternativePath'), blankNode('5')),
  quad(blankNode('5'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), namedNode('http://example.org/myPath/3-1')),
  quad(blankNode('5'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), blankNode('6')),
  quad(blankNode('6'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), blankNode('10')),
  quad(blankNode('6'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), blankNode('7')),
  quad(blankNode('7'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), namedNode('http://example.org/myPath/3-2')),
  quad(blankNode('7'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil')),
  quad(blankNode('10'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), namedNode('http://example.org/myPath/4-1')),
  quad(blankNode('10'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), blankNode('11')),
  quad(blankNode('11'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), blankNode('12')),
  quad(blankNode('11'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), blankNode('14')),
  quad(blankNode('14'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), blankNode('15')),
  quad(blankNode('14'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil')),
  quad(blankNode('12'), namedNode('http://www.w3.org/ns/shacl#zeroOrMorePath'), namedNode('http://example.org/myPath/5')),
  quad(blankNode('15'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), blankNode('16')),
  quad(blankNode('15'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), blankNode('17')),
  quad(blankNode('17'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), blankNode('18')),
  quad(blankNode('17'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil')),
  quad(blankNode('16'), namedNode('http://www.w3.org/ns/shacl#zeroOrMorePath'), namedNode('http://example.org/test1')),
  quad(blankNode('18'), namedNode('http://www.w3.org/ns/shacl#zeroOrMorePath'), namedNode('http://example.org/test2')),
]);
const engine3 = new ExtendedEngine(new QueryEngine([store3]));

const data3 = new Store();
data3.addQuads([
  quad(namedNode('http://example.org/JESSE'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), namedNode('http://example.org/person')),
  quad(namedNode('http://example.org/JESSE'), namedNode('http://example.org/myPath/4-0'), namedNode('http://example.org/thing1')),
  quad(namedNode('http://example.org/JESSE'), namedNode('http://example.org/myPath/4-0'), namedNode('http://example.org/thing2')),
  quad(namedNode('http://example.org/JESSE'), namedNode('http://example.org/myPath/4-1'), namedNode('http://example.org/thing3')),
  quad(namedNode('http://example.org/thing3'), namedNode('http://example.org/myPath/5'), namedNode('http://example.org/thing4')),
  quad(namedNode('http://example.org/thing3'), namedNode('http://example.org/myPath/5'), namedNode('http://example.org/thing6')),
  quad(namedNode('http://example.org/thing4'), namedNode('http://example.org/myPath/5'), namedNode('http://example.org/thing5')),
  quad(namedNode('http://example.org/thing4'), namedNode('http://example.org/myPath/5'), namedNode('http://example.org/thing6')),
  quad(namedNode('http://example.org/thing4'), namedNode('http://example.org/test1'), namedNode('http://example.org/thing6')),
  quad(namedNode('http://example.org/thing5'), namedNode('http://example.org/test1'), namedNode('http://example.org/thing6')),
]);

const dataEngine3 = new ExtendedEngine(new QueryEngine([data3]));

(async () => {


  // const simplified = simplify(await extractProperties(namedNode('http://example.org/myShape'), engine));
  // const ts = getCountersQuery(simplified, namedNode('http://example/JESSE'));

  const simplified3 = simplify(await extractProperties(namedNode('http://example.org/myShape'), engine3));
  const ts3 = getCountersQuery(simplified3, namedNode('http://example.org/JESSE'));

  if (!ts3) {
    throw new Error('Expected counter query to be defined');
  }

  const result = await dataEngine3.query(ts3);
  if (result.type !== 'bindings') {
    throw new Error('Expected Bindings');
  }
  const bindings = await result.bindings();
  if (bindings.length !== 1) {
    throw new Error('Expected bindings to have length 1');
  }

  console.log(
    JSON.stringify(
      simplified3,
      null,
      2,
    ),
  );
  console.log(ts3);
  console.log(bindings[0].get('?0977f4744562aa9c884013b5682b5f7b'));
  console.log(bindings[0].get('?4692d873e275648ee36990eaebf15ac6'));
  console.log(bindings[0].get('?9bdbc8e3172113bf17d1621ca958193c'));
})();

// const store = new Store();
// store.addQuads([
//   quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), namedNode('http://www.w3.org/ns/shacl#NodeShape')),
//   quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/ns/shacl#property'), blankNode('1')),
//   quad(blankNode('1'), namedNode('http://www.w3.org/ns/shacl#path'), namedNode('http://example.org/myPath')),
// ]);
// const engine = new ExtendedEngine(new QueryEngine([store]));
// (async () => {
//   console.log(await extractProperties(namedNode('http://example.org/myShape'), engine))
// })();
