const kompute = require('../lib');
const Kompute = require('../lib/kompute');

const { getSimple } = require('./data');

describe('Kompute', () => {
  test('Pass array as first argument', () => {
    try {
      kompute({ value: 1 });
    } catch (err) {
      expect(err.message).toBe('First argument should be an Array');
    }
  });

  test('Instantiate Kompute and merge default options', () => {
    const simple = getSimple();
    const kompute = new Kompute(simple, { makeDependencyTree: false });
    expect(kompute).toBeDefined();
    expect(kompute.arr).toEqual(simple);
    expect(kompute.tree).toEqual({});
    expect(typeof kompute.options.getId).toBe('function');
    expect(kompute.options.makeDependencyTree).toBe(false);
  });

  test('findItemById in inner array', () => {
    const simple = getSimple();
    const kompute = new Kompute(simple, { makeDependencyTree: false });
    const item = kompute.findItemById('id02');
    expect(item).toEqual(simple[1]);
  });

  test('makeDependencyTree without initial computation', () => {
    const simple = getSimple();
    const kompute = new Kompute(simple, {
      makeDependencyTree: false,
      initialComputation: false,
    });
    kompute.makeDependencyTree();

    console.log(kompute.tree);
  });

  test.skip('Return computed array', () => {
    const simple = getSimple();
    const k = kompute(simple);
    expect(Array.isArray(k)).toBe(true);
    expect(k).toHaveLength(simple.length);
  });

  test.skip('isObserved property', () => {
    const arr = kompute(getSimple());
    arr.forEach(item => {
      expect(item.isObserved).toBeDefined();
      expect(item.isObserved).toBe(true);
    });
  });

  test.skip('Initial computation', () => {
    const simple = getSimple();
    const k = kompute(simple);

    expect(k).not.toEqual(simple);

    expect(k[0]).toEqual({ id: 'element1', value: 2 });
    expect(k[1]).toEqual({ id: 'element2', value: 4 });
    expect(k[2]).toEqual({ id: 'element3', value: 6 });
    expect(k[0].isObserved).toBeDefined();
    expect(k[0].observedBy).toEqual(['element2.value', 'element3.value']);
  });
});
