import { quad, namedNode, blankNode } from '@rdfjs/data-model';

export default () => [
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
];
