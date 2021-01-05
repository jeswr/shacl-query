// /* eslint-disable no-await-in-loop */
// import { Term } from 'rdf-js';
// import ExtendedEngine from './utils/engine';

import { NamedNode } from 'rdf-js';
import { Path } from './types';
import { generateVar } from './utils/variable-generator';
import * as R from 'ramda'

/**
 * Trims off all parts of the query not relevant
 * to obtaining the length of repeated path sections
 * @param {Path} query
 * @return {Path | false}
 */
export function trimmer(query: Path): Path | false {
  switch (query.type) {
    case 'term': {
      return false;
    }
    case 'alternate': {
      const path: Path[] = [];
      for (const p of query.path) {
        const trimmed = trimmer(p);
        if (trimmed) {
          path.push(trimmed);
        }
      }
      if (path.length === 0) {
        return false;
      } if (path.length === 1) {
        return path[0];
      }
      return {
        type: 'alternate',
        focus: query.focus,
        path,
      };
    }
    case 'inverse': {
      const trimmed = trimmer(query.path);
      return trimmed && { type: 'inverse', path: trimmed, focus: query.focus };
    }
    case 'sequence': {
      for (let i = query.path.length - 1; i >= 0; i -= 1) {
        const trimmed = trimmer(query.path[i]);
        if (trimmed) {
          if (i === 0) {
            return query.path[0];
          }
          return {
            type: 'sequence',
            path: [...query.path.slice(0, i), trimmed],
            focus: query.focus,
          };
        }
      }
      return false;
    }
    case 'zeroOrMore': {
      return query;
    }
    case 'zeroOrOne': {
      const trimmed = trimmer(query.path);
      return trimmed && { type: 'zeroOrOne', path: trimmed, focus: query.focus };
    }
    default:
      throw new Error(`Invalid query ${query}`);
  }
}

/**
 * Use to test whether a path contains a zero or more query term
 * @param {Path} query
 */
function hasZeroOrMore(query: Path): boolean {
  switch (query.type) {
    case 'sequence':
    case 'alternate':
      return query.path.some((path) => hasZeroOrMore(path));
    case 'inverse':
    case 'zeroOrOne':
      return hasZeroOrMore(query);
    case 'zeroOrMore':
      return true;
    case 'term':
      return false;
    default:
      throw new Error(`Invalid Query: ${query}`);
  }
}

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
        const pathString = query.path.map((path) => writeStaticComponent(path, true)).join('|');
        return isNested ? `(${pathString})` : pathString;
      }
    }
    default:
      throw new Error(`Invalid Query: ${query}`);
  }
}

function splitAlternative(query: Path): Path[] {
  switch (query.type) {
    case 'term': return [query];
    case 'alternate': {
      let r: Path[] = [];
      for (const path of query.path) {
        r = [...r, ...splitAlternative(path)]
      }
      return r;
    }
    // Applies cross prouc tot sequence
    case 'sequence': {
      const [first, ...applied] = query.path.map(path => splitAlternative(path));
      let path = first.map(x => [x])
      for (const app of applied) {
        const prod = R.xprod(path, app);
        path = prod.map(([x, y]) => [...x, y])
      }
      return path.map(p => ({
        type: 'sequence',
        path: p,
        focus: query.focus
      }))
    }
    case 'zeroOrMore':
    case 'zeroOrOne':
    case 'inverse': {
      return splitAlternative(query.path).map(path => ({
        type: query.type,
        path,
        focus: query.focus
      }))
    }
    default: {
      throw new Error(`Invalid query ${query}`)
    }
  }
}

function breakZeroOrMore(query: Path): { path: Path, zeroOrMore: Path }[] {
  // Note splitAlternative should have already been applied so 'alternative' is not handled
  switch (query.type) {
    case 'term':
    case 'zeroOrMore':
    case 'inverse'
  }
}

/**
 * Returns a list of each path, each corresponds
 * to a unique zero or more path that we need to
 * test
 */
function getZeroOrMorePaths(query: Path): Path[] {
  // APPROCH break into paths with the {Path} type and then run the static path constructor

  // Step 1: Break down into alternatives


  // Step 2: Break off at each zero or more path

  if (query)

    if (query.t)



      for (const q of query.path) {

      }



  switch (query.type) {

  }
}

function writeCounterSelect(query: Path, subject: NamedNode) {
  const generator = generateVar();
  // This implementation is *far from optimal*



  query.
    for(const q of query) {

  }
  return '';
}

/**
 * This function is used to collect all the paths
 * that we need to run the count query for
 */
// eslint-disable-next-line import/prefer-default-export
export function getCountersQuery(query: Path): string | false {
  // NOTE: We don't care about the focus here

  // First we trim the query so it only contains the
  // components necessary for counters
  const trimmed = trimmer(query);
  // If trimmed is false then we do not have to create a
  // construct query
  if (!trimmed) {
    return false;
  }
}

// export default async function getCounters(node: Term, engine: ExtendedEngine) {
//   const res = await engine.getBoundResults(`SELECT DISTINCT ?r WHERE { <${node.value}> <http://www.w3.org/ns/shacl#property> ?r }`);

//   for (const result of res) {
//     // TODO: Handling of paths *inside* logical modifiers
//     const path = await engine.getBoundResults(`SELECT DISTINCT ?r WHERE { <${node.value}> <http://www.w3.org/ns/shacl#path> ?r }`);
//     // if (result.termType === 'NamedNode') {

//     // } else if (result.value) {

//     // }
//   }

//   const triples = [];
//   if (path.termType === 'NamedNode') {
//     triples.push({
//       triple: [name, `<${path.value}>`, generator.next().value],
//       optional: false, // If this is set to true then OPTIONAL { /* triple */ } is used
//     });
//   } else if (path.termType === 'BlankNode') {
//     const predicate = await engine.getBoundResults(`SELECT DISTINCT ?r WHERE { <${path.value}> ?r ?o }`);
//     if (predicate.length === 1 && predicate[0].termType === 'NamedNode') {
//       // This is one of the sh:???path predicates
//       switch (predicate[0].value) {
//         // This one we need to add ? on the actual query so that
//         case 'http://www.w3.org/ns/shacl#zeroOrOnePath':
//           return `?${path}`;
//         case 'http://www.w3.org/ns/shacl#oneOrMorePath':
//         case 'http://www.w3.org/ns/shacl#zeroOrMorePath':
//         case 'http://www.w3.org/ns/shacl#alternativePath':
//         case 'http://www.w3.org/ns/shacl#inversePath':
//         default:
//           throw new Error(`Invalid shacl path type ${predicate[0].value}`);
//       }
//     } else if (predicate.length === 2) {
//       // This is a list and hence a sequential path
//       let tempName = name;
//       const list = await engine.getList(path);
//       for (const elem of list) {
//         addPath(elem, tempName, generator, engine);
//         tempName = `?${generator.next().value}`;
//       }
//     } else {
//       throw new Error('Invalid path');
//     }

//     // // TODO: Handle all other path types - atm this just works for sequence
//     // const list = await engine.getList(path)
//   } else {
//     throw new Error('Expected blank node *or* named node');
//   }
// }
