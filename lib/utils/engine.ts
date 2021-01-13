/* eslint-disable class-methods-use-this */
/* eslint-disable no-undef */
import { Term } from 'rdf-js';
import type { IQueryResultBindings } from '@comunica/actor-init-sparql';
import { queryEngine } from '../types';

// @ts-ignore
function mapBindings(bindings) {
  // @ts-ignore
  return bindings.map((binding) => {
    if (binding && 'skolemized' in binding) {
      // @ts-ignore
      // eslint-disable-next-line no-param-reassign
      binding.value = binding.skolemized.value;
    }
    return binding;
  });
}

/**
 * Query engine extended with convenience methods for
 * use by this module
 */
export default class ExtendedEngine {
  private engine: queryEngine;

  constructor(engine: queryEngine) {
    this.engine = engine;
  }

  async query(q: string) {
    return this.engine.query(q);
  }

  /**
   * A function that processes result bindings from the engine
   * @param query A sparql query in one variable named 'r'
   */
  async getBoundResults(query: string): Promise<Term[]> {
    const res = await this.query(query);
    if (res.type !== 'bindings') {
      throw new Error('Bindings expected');
    }
    return (await res.bindings()).map((binding) => binding.get('?r'));
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
  // This function REQUIRES blank nodes to be skolemized
  async getList(term: Term): Promise<Term[]> {
    let tempTerm = term;
    const result: (Promise<Term> | Term)[] = [];
    // TODO: Optimize this
    while (!(tempTerm.termType === 'NamedNode' && tempTerm.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil')) {
    // TODO: REMOVE WHEN FINISHED DEBUGGING
    // eslint-disable-next-line no-await-in-loop
      result.push(await this.getSingle(`SELECT ?r WHERE { <${
        // @ts-ignore
        tempTerm.skolemized?.value ?? tempTerm.value}> <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> ?r }`));
      // eslint-disable-next-line no-await-in-loop
      tempTerm = await this.getSingle(`SELECT ?r WHERE { <${
        // @ts-ignore
        tempTerm.skolemized?.value ?? tempTerm.value}> <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> ?r }`);
    }
    return Promise.all(result);
  }
}
