import md5 from 'md5';
import { Path } from './types';

/**
 * Writes a static path
 */
function writeStaticComponent(query: Path, isNested = false): string {
  switch (query.type) {
    case 'term':
      return `<${query.path.value}>`;
    case 'inverse':
      return `^${writeStaticComponent(query.path, true)}`;
    case 'zeroOrOne':
      return `${writeStaticComponent(query.path, true)}?`;
    case 'zeroOrMore': // TODO: POSSIBLY REMOVE
      return `${writeStaticComponent(query.path, true)}*`;
    case 'alternate': {
      if (query.path.length === 0) {
        throw new Error('Expected alternative path to have length >= 1');
      } else if (query.path.length === 1) {
        return writeStaticComponent(query.path[0], isNested);
      } else {
        const pathString = query.path.map((path) => writeStaticComponent(path, true)).join('|');
        return isNested ? `(${pathString})` : pathString;
      }
    }
    case 'sequence': {
      if (query.path.length === 0) {
        throw new Error('Expected sequence path to have length >= 1');
      } else if (query.path.length === 1) {
        return writeStaticComponent(query.path[0], isNested);
      } else {
        const pathString = query.path.map((path) => writeStaticComponent(path, true)).join('/');
        return isNested ? `(${pathString})` : pathString;
      }
    }
    default:
      throw new Error(`Invalid Query: ${query}`);
  }
}

// eslint-disable-next-line import/prefer-default-export
export function pathHash(path: { path?: Path, zeroOrMore: Path }): string {
  const zeroOrMore = writeStaticComponent(path.zeroOrMore);
  const p = path.path ? writeStaticComponent(path.path) : '';
  return md5(`${zeroOrMore}&${p}`);
}
