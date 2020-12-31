import type { IQueryResult } from '@comunica/actor-init-sparql';

/**
 * This interface defines the API structure that the
 * input query engines must provide
 */
export interface queryEngine {
  /**
   * Evaluate the given query
   * @param {string | Algebra.Operation} query A query string or algebra.
   * @param context An optional query context.
   * @return {Promise<IActorQueryOperationOutput>} A promise that resolves to the query output.
   */
  query(query: string): Promise<IQueryResult>;
}
