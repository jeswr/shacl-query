import md5 from 'md5';
import { Path } from './types';

export function pathHash(path: { path?: Path, zeroOrMore: Path }): string {
  const zeroOrMore = writeStaticComponent(path.zeroOrMore);
  const p = path.path ? writeStaticComponent(path.path) : '';
  return md5(`${zeroOrMore}&${p}`);
}
