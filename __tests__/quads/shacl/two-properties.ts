import { quad, namedNode, blankNode } from '@rdfjs/data-model';

export default () => [
  quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), namedNode('http://www.w3.org/ns/shacl#NodeShape')),
  quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/ns/shacl#property'), blankNode('1')),
  quad(namedNode('http://example.org/myShape'), namedNode('http://www.w3.org/ns/shacl#property'), blankNode('2')),
  quad(blankNode('1'), namedNode('http://www.w3.org/ns/shacl#path'), namedNode('http://example.org/myPath/1')),
  quad(blankNode('2'), namedNode('http://www.w3.org/ns/shacl#path'), namedNode('http://example.org/myPath/2')),
];
