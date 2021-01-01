import { Term } from 'rdf-js';
import { queryEngine } from './types';

/**
 * Query engine extended with convenience methods for
 * use by this module
 */
export default class ExtendedEngine {
  private engine: queryEngine;

  constructor(engine: queryEngine) {
    this.engine = engine;
  }

  query(q: string) {
    return this.engine.query(q);
  }

  /**
   * A function that processes result bindings from the engine
   * @param query A sparql query in one variable named 'r'
   */
  async getBoundResults(query: string): Promise<Term[]> {
    const res = await this.engine.query(query);
    if (res.type !== 'bindings') {
      throw new Error('Bindings expected');
    }
    const bindings = (await res.bindings()).map((binding) => binding.get('?r'));
    for (const binding of bindings) {
      if ('skolemized' in binding) {
        // @ts-ignore
        binding.value = binding.skolemized.value;
      }
    }
    return bindings;
  }

  // Used for queries where exactly one object is expected
  async getSingle(query: string): Promise<Term> {
    const res = await this.getBoundResults(query);
    if (res.length !== 1) {
      throw new Error(`Exactly one object expected for query: ${query}`);
    }
    return res[0];
  }

  // Extracts an rdf:list
  async getList(term: Term): Promise<Term[]> {
    let tempTerm = term;
    const result: Term[] = [];
    // TODO: Optimize this
    while (!(tempTerm.termType === 'NamedNode' && tempTerm.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil')) {
      // eslint-disable-next-line no-await-in-loop
      result.push(await this.getSingle(`SELECT DISTINCT ?r WHERE { <${tempTerm.value}> <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> ?r }`));
      // eslint-disable-next-line no-await-in-loop
      tempTerm = await this.getSingle(`SELECT DISTINCT ?r WHERE { <${tempTerm.value}> <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> ?r }`);
    }
    return result;
  }
}
