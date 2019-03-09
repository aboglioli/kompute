const kompute = require('../lib');
const Kompute = require('../lib/kompute');

const { getSimple } = require('./data');

describe('Kompute class', () => {
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

  test('dependsOn must be a string, an array or a function', () => {
    const kompute = new Kompute(
      [
        ...getSimple(),
        {
          id: 'id04',
          value: {
            dependsOn: { obj: true },
            compute: () => {},
          },
        },
      ],
      { makeDependencyTree: false, initialComputation: false },
    );

    try {
      kompute.makeDependencyTree();
    } catch (err) {
      expect(err.message).toBe(
        '"dependsOn" must be a string, an array or a function. Found "object" on id04.value',
      );
    }
  });

  test('compute must be a function', () => {
    const kompute = new Kompute(
      [
        ...getSimple(),
        {
          id: 'id04',
          value: {
            dependsOn: 'id01.value',
            compute: { obj: true },
          },
        },
      ],
      { makeDependencyTree: false, initialComputation: false },
    );

    try {
      kompute.makeDependencyTree();
    } catch (err) {
      expect(err.message).toBe(
        '"compute" must be a function. Found "object" on id04.value',
      );
    }
  });

  test('makeDependencyTree without initial computation (simple)', () => {
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

  test('makeDependencyTree with initial computation (simple)', () => {
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
});

describe('kompute lib and Proxy wrapper', () => {
  test('default options', () => {
    const simple = getSimple();
    const k = kompute(simple);
    expect(Array.isArray(k)).toBe(true);
    expect(k).toHaveLength(simple.length);
    expect(k).toEqual([
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

  test('isOserved property', () => {
    const arr = kompute(getSimple());
    expect(arr[0].isObserved).toBe(true);
    expect(arr[1].isObserved).toBe(false);
    expect(arr[2].isObserved).toBe(false);
  });

  test('observedBy property', () => {
    const arr = kompute(getSimple());
    expect(arr[0].observedBy).toEqual(['id02.value', 'id03.value']);
    expect(arr[1].observedBy).toEqual([]);
    expect(arr[2].observedBy).toEqual([]);
  });
});
