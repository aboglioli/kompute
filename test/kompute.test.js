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
    const kompute = new Kompute(simple, {
      makeDependencyTree: false,
      initialComputation: false,
    });
    expect(kompute).toBeDefined();
    expect(kompute.arr).toEqual(simple);
    expect(kompute.tree).toEqual([]);
    expect(typeof kompute.options.getId).toBe('function');
    expect(kompute.options.makeDependencyTree).toBe(false);
    expect(kompute.options.initialComputation).toBe(false);
  });

  test('findItemById in inner array', () => {
    const simple = getSimple();
    const kompute = new Kompute(simple, {
      makeDependencyTree: false,
      initialComputation: false,
    });
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

    expect(kompute.arr).toEqual(simple);
    expect(kompute.tree).toHaveLength(2);
    expect(Object.keys(kompute.tree[1])).toEqual([
      'prop',
      'dependsOn',
      'compute',
    ]);
    expect(kompute.tree[1].prop).toEqual('id03.value');
    expect(kompute.tree[1].dependsOn).toEqual(['id01.value']);
    expect(typeof kompute.tree[1].compute).toEqual('function');
  });

  test('makeDependencyTree with initial computation', () => {
    const simple = getSimple();
    const kompute = new Kompute(simple, {
      makeDependencyTree: true,
      initialComputation: true,
    });

    expect(kompute.arr).toEqual([
      {
        id: 'id01',
        value: 2,
      },
      {
        id: 'id02',
        value: 4,
      },
      {
        id: 'id03',
        value: 6,
      },
    ]);
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
