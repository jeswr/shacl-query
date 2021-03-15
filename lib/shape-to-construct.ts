import { Map } from 'immutable';
import { NamedNode, Quad } from 'rdf-js';
import { toSparql } from 'sparqlalgebrajs';
import { extractProperties } from './basic-extract';
import { ConstructPatternFactory } from './ConstructPatternFactory';
import { simplify } from './simplify-statements';
import { ExtendedEngine } from './utils';

export default async function run(
  shaclEngine: ExtendedEngine,
  dataEngine: ExtendedEngine,
  shacl: NamedNode,
  node: NamedNode,
): Promise<Quad[]> {
  const properties = await extractProperties(shacl, shaclEngine);
  const simplifiedProperties = simplify(properties);
  // const counterQuery = getCountersQuery(simplifiedProperties, node);
  // if (!counterQuery) {
  //   return false;
  // }
  // const counterBindings = await dataEngine.query(counterQuery);
  // const processedCounters = processCount(counterBindings);
  // return processedCounters;
  const factory = new ConstructPatternFactory(Map(), false, 6);
  const query = factory.createConstructPattern(simplifiedProperties, node);
  const data = await dataEngine.query(toSparql(query));
  if (data.type !== 'quads') {
    throw new Error('Quads expected from construct query');
  }
  return data.quads();
}
