/* eslint-disable no-undef */
import { Parser } from 'n3';
import * as fs from 'fs';
import path from 'path';
import { namedNode } from '@rdfjs/data-model';
import { quadsToEngine } from './utils';
import extractor from '../lib/shape-to-construct';

describe('', () => {
  // Testing that the shacl-shacl constraint can extract the shacl-shacl
  // constraint (isn't that fun!)
  const parser = new Parser();
  const quads = parser.parse(fs.readFileSync(path.join(__dirname, 'files', 'shacl-shacl.ttl')).toString());
  const engine = quadsToEngine(quads);
  const shapeShape = namedNode('http://www.w3.org/ns/shacl-shacl#');
  it('', async () => {
    const data = await extractor(engine, engine);
  });
});

// DATA FOR MAIN TEST WHEN WE GET A CHANCE TO WRITE IT PROPERLY
// const myFactory = new ConstructPatternFactory(Map(), false, 5);

// const toTerm = (t: string): Path => ({
//   type: 'term',
//   path: namedNode(t),
//   focus: true,
// });

// const thePath: Path = {
//   focus: false,
//   path: [
//     toTerm('http://example.org/myPath/1'),
//     toTerm('http://example.org/myPath/2'),
//   ],
//   type: 'alternate',
// };

// const mySequence: Path = {
//   type: 'sequence',
//   path: [thePath, thePath, thePath],
//   focus: false,
// };

// const myZeroOrOne: Path = {
//   type: 'zeroOrMore',
//   path: mySequence,
//   focus: false,
// };

// console.log(toSparql(myFactory.pathToConstructQuery({
//   focus: true,
//   path: [
//     toTerm('http://list'),
//     myZeroOrOne,
//     toTerm('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'),
//     {
//       type: 'inverse',
//       path: thePath,
//       focus: false,
//     },
//   ],
//   type: 'sequence',
// }, namedNode('http://Jesse'))));
