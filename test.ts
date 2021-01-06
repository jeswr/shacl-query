import { newEngine } from "@comunica/actor-init-sparql";
import { quad, namedNode } from "@rdfjs/data-model";
import { Store } from "n3";

const myStore = new Store([
  quad(namedNode('http://example.org/alice'), namedNode('http://example.org/friend'), namedNode('http://example.org/bob')),
  quad(namedNode('http://example.org/bob'), namedNode('http://example.org/friend'), namedNode('http://example.org/charlie')),
  quad(namedNode('http://example.org/alice'), namedNode('http://example.org/friend'), namedNode('http://example.org/charlie')),
]);

const query = `
  SELECT (count(?friend) as ?count)
  WHERE {
    <http://example.org/alice> <http://example.org/friend> ?f . ?f <http://example.org/friend>* ?friend
  }`;

const myEngine = newEngine();

(async () => {
  const result = await myEngine.query(query, { sources: [myStore] });
  if (result.type !== 'bindings') {
    throw new Error('Expected Bindings');
  }
  const bindings = await result.bindings();
  const count = bindings[0]?.get('?count').value;
  console.log(count);
})();