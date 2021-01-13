import { quad, namedNode } from '@rdfjs/data-model';

export default () => [
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
];
