/* eslint-disable no-undef */
import { Store } from 'n3';
import { newEngine } from '@comunica/actor-init-sparql-rdfjs';
import type { ActorInitSparql } from '@comunica/actor-init-sparql';

/**
 * A query engine class for use by the test functions
 */
export default class QueryEngine {
  private sources: Store[] | string[] = [];

  private engine: ActorInitSparql = newEngine();

  constructor(sources: Store[] | string[], engine?: ActorInitSparql) {
    this.sources = sources;
    if (engine) {
      this.engine = engine;
    }
  }

  query(q: string) {
    return this.engine.query(q, {
      sources: this.sources,
    });
  }
}
