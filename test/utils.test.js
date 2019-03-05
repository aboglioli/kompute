const { getSimple } = require('./data');
const { normalizeArray } = require('../lib/utils');

describe('Helpers', () => {
  test('normalizeArray', () => {
    const simple = getSimple();
    const n = normalizeArray(simple, item => item.id);
    expect(Array.isArray(n)).toBe(false);
    expect(typeof n).toBe('object');
    expect(Object.keys(n)).toEqual(['element1', 'element2', 'element3']);
    expect(n.element1).toEqual(simple[0]);
  });
});
