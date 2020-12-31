import { generateVar, numToString } from '../lib/variable-generator';

describe('Unit tests for numToString', () => {
  it('Should convert 0 to \'a\'', () => {
    expect(numToString(0)).toEqual('a')
  });
  it('Should convert 1 to \'b\'', () => {
    expect(numToString(1)).toEqual('b')
  });
  it('Should convert 2 to \'c\'', () => {
    expect(numToString(2)).toEqual('c')
  });
  it('Should convert 3 to \'d\'', () => {
    expect(numToString(3)).toEqual('d')
  });
  it('Should convert 23 to \'x\'', () => {
    expect(numToString(23)).toEqual('x')
  });
  it('Should convert 24 to \'y\'', () => {
    expect(numToString(24)).toEqual('y')
  });
  it('Should convert 25 to \'z\'', () => {
    expect(numToString(25)).toEqual('z')
  });
  it('Should convert 26 to \'aa\'', () => {
    expect(numToString(26)).toEqual('aa')
  });
  it('Should convert 26 * 2 to \'ba\'', () => {
    expect(numToString(26 * 2)).toEqual('ba')
  });
  it('Should convert 27 to \'ab\'', () => {
    expect(numToString(27)).toEqual('ab')
  });
  it('Should convert 28 to \'ac\'', () => {
    expect(numToString(28)).toEqual('ac')
  });
  it('Should convert 26 * 26 to \'aaa\'', () => {
    expect(numToString(26 * 26)).toEqual('aaa')
  });
})

describe('Unit tests for the variable name generator', () => {
  it('Should return \'a\' as the first variable name', () => {
    const g = generateVar()
    const v = g.next();
    expect(v.value).toEqual('a')
  })
  it('Generate first 28 char correctly', () => {
    const g = generateVar()
    let i = -1
    for (const v of g) {
      i++
      if (i < 26) {
        expect(v).toEqual('abcdefghijklmnopqrstuvwxyz'[i])
      }
      if (i === 26) {
        expect(v).toEqual('aa')
      }
      if (i === 27) {
        expect(v).toEqual('ab')
      }
      if (i > 28) {
        break;
      }
    }
  })
  it('First 100000 strings are unique', () => {
    const hashes: {[x: string]: boolean} = {};
    const g = generateVar()
    let i = -1
    for (const v of g) {
      i++;
      expect(hashes[i]).toEqual(undefined)
      hashes[i] = true;
      if (i > 10000) {
        break;
      }
    }
  })
})
