import type { IQueryResult } from '@comunica/actor-init-sparql';
import type { Term } from 'rdf-js';

export default async function processCount(result: IQueryResult) {
  if (result.type !== 'bindings') {
    throw new Error('Expected Bindings');
  }
  const bindings = await result.bindings();
  if (bindings.length !== 1) {
    throw new Error('Expected bindings to have length 1');
  }
  return bindings[0]
    // Remove '?' from key
    .mapKeys((key) => {
      if (!key) {
        throw new Error('Error: Key falsy');
      }
      return key.slice(1);
    })
    // Convert to actual integers
    .map((value?: Term): number => {
      if (value?.termType !== 'Literal') {
        throw new Error('Expected Literal');
      }
      const num = parseInt(value.value, 10);
      if (Number.isInteger(num)) {
        return num;
      }
      throw new Error('Expected Integer');
    })
    .toMap();
}
