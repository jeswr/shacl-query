import { Store } from 'n3';
import { Quad } from 'rdf-js';
import { ExtendedEngine } from '../../lib/utils';
import QueryEngine from './query-engine';

export default (quads: Quad[]) => {
  const store = new Store();
  store.addQuads(quads);
  return new ExtendedEngine(new QueryEngine([store]));
};
