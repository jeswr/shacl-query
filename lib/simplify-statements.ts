/* eslint-disable import/prefer-default-export */
/* eslint-disable no-case-declarations */
import { AndBuilder } from 'logic-statement-ts';
import { Path } from './types';

/**
 * There is a lot more that can be done - some through logic-statement-ts
 * @param path The path element to simplify
 * @param inverse Should the particular path be inverted
 */
export function simplify(path: Path, inverse = false): Path {
  switch (path.type) {
    case 'alternate': {
      let p: Path[] = [];
      let { focus } = path;
      const paths = path.path.map((pt) => simplify(pt, inverse));
      for (const pth of paths) {
        if (pth.type === 'alternate') {
          p = [...p, ...pth.path];
          p.concat(pth.path);
          focus = focus || pth.focus;
        } else {
          p.push(path);
        }
      }
      return { type: 'alternate', path: p, focus: path.focus };
    }
    case 'inverse':
      return simplify({ ...path, focus: path.path.focus || path.focus }, !inverse);
    case 'zeroOrOne':
      return { type: 'zeroOrOne', path: simplify(path.path, inverse), focus: path.focus };
    case 'zeroOrMore':
      return { type: 'zeroOrMore', path: simplify(path.path, inverse), focus: path.focus };
    case 'sequence': {
      let p: Path[] = [];
      let { focus } = path;
      const paths = path.path.map((pt) => simplify(pt, inverse));
      for (const pth of paths) {
        if (pth.type === 'sequence') {
          p = [...p, ...pth.path];
          p.concat(pth.path);
          focus = focus || pth.focus;
        } else {
          p.push(path);
        }
      }
      return { type: 'alternate', path: p, focus: path.focus };
    }
    case 'term':
      return inverse ? { type: 'inverse', path, focus: false } : path;
    default:
      throw new Error('Invalid path');
  }
}
