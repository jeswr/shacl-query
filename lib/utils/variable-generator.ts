// Only needs to be exported for unit tests
// This function is also really messy
export function numToString(i: number): string {
  let itemp = i;
  let str = '';
  if (itemp <= 25) {
    return String.fromCharCode((itemp % 26) + 97);
  }
  while (i > 25) {
    str = String.fromCharCode((itemp % 26) + 97) + str;
    itemp = Math.floor(itemp / 26);
  }
  str = String.fromCharCode((itemp % 26) + 96) + str;
  return str;
}

/**
 * Used to generate the variable names
 */
export function* generateVar(): Generator<string, string> {
  let i = 0;
  while (true) {
    yield numToString(i += 1);
  }
}
