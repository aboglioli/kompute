const kompute = require('../lib');

const { getProducts, getSimple } = require('./data');
const { calculateCost } = require('./helpers');

describe('Kompute', () => {
  test('Pass array as first argument', () => {
    try {
      kompute({ value: 1 });
    } catch (err) {
      expect(err.message).toBe('First argument should be an Array');
    }
  });

  test('Return computed array', () => {
    const simple = getSimple();
    const k = kompute(simple);
    expect(Array.isArray(k)).toBe(true);
    expect(k).toHaveLength(simple.length);
  });

  test('isProxied property', () => {
    const arr = kompute(getSimple());
    arr.forEach(item => {
      expect(item.isProxied).toBe(true);
    });
  });
});
