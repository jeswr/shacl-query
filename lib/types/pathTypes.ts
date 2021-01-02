/* eslint-disable no-use-before-define */
import type { Term } from 'rdf-js';

interface PathInterface {
  type: string;
  path: Path | Path[] | Term;
  focus: boolean; // See if this should become a priority level
}
export interface ListPath extends PathInterface {
  type: 'sequence' | 'alternate' ;
  path: Path[];
}

export interface AtomPath extends PathInterface {
  // For the inverse path we just switch the order
  // of the variables
  type: 'zeroOrOne' | 'zeroOrMore' | 'inverse';
  path: Path;
}

export interface TermPath extends PathInterface {
  type: 'term';
  path: Term;
}

export type Path = ListPath | AtomPath | TermPath;
