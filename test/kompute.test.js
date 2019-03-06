const kompute = require('../lib');

const { getSimple } = require('./data');

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

  test('isObserved property', () => {
    const arr = kompute(getSimple());
    arr.forEach(item => {
      expect(item.isObserved).toBeDefined();
      expect(item.isObserved).toBe(true);
    });
  });

  test('Initial computation', () => {
    const simple = getSimple();
    const k = kompute(simple);

    expect(k).toEqual(simple);

    // expect(k[0]).toEqual({ id: 'element1', value: 2 });
    // expect(k[1]).toEqual({ id: 'element2', value: 4 });
    // expect(k[2]).toEqual({ id: 'element3', value: 6 });
    // expect(k[0].isObserved).toBeDefined();
    // expect(k[0].observedBy).toEqual(['element2.value', 'element3.value']);
  });
});
