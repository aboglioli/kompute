const {
  findItemById,
  findNodeByProp,
  findDependentNodes,
  splitPath,
  makeDependencyTree,
  compute,
} = require('../lib/kompute');

const kompute = require('../lib');

const { getSimple, getComplexDependencies } = require('./data');

const getId = item => item.id;

describe('Utils', () => {
  test('findItemById', () => {
    const item = findItemById(
      {
        getId: item => item._id,
        arr: [{ _id: 'element1', value: 3 }],
      },
      'element1',
    );
    expect(item).toBeDefined();
    expect(item.value).toBe(3);
  });

  test('findNodeByProp', () => {
    const tree = [
      {
        prop: 'element2.value',
        dependsOn: ['element1.value'],
        compute: (item, [element1]) => element1.value * 2,
      },
    ];
    // with exact path
    let node = findNodeByProp({ tree }, 'element2.value', true);
    expect(node).toBeDefined();
    expect(node).toEqual(tree[0]);

    // relative path
    node = findNodeByProp({ tree }, 'element2', false);
    expect(node).toBeDefined();
    expect(node).toEqual(tree[0]);

    node = findNodeByProp({ tree }, 'element2');
    expect(node).not.toBeDefined();

    node = findNodeByProp({ tree }, 'element1.value');
    expect(node).not.toBeDefined();
  });

  test('findDependentNodes', () => {
    const tree = [
      {
        prop: 'element2.value',
        dependsOn: ['element1.value'],
        compute: (item, [element1]) => element1.value * 2,
      },
      {
        prop: 'element3.value',
        dependsOn: ['element1.value', 'element2.value'],
        compute: (item, [element1, element2]) =>
          element1.value * element2.value,
      },
    ];
    // with exact path
    let nodes = findDependentNodes({ tree }, 'element1', true);
    expect(nodes).toHaveLength(0);

    // relative path
    nodes = findDependentNodes({ tree }, 'element1', false);
    expect(nodes).toHaveLength(2);

    nodes = findDependentNodes({ tree }, 'element1.value');
    expect(nodes).toHaveLength(2);

    nodes = findDependentNodes({ tree }, 'element2.value');
    expect(nodes).toHaveLength(1);
  });

  test('splitPath', () => {
    let [id, path, prop] = splitPath('element3.data.deep.value');
    expect(id).toBe('element3');
    expect(path).toBe('data.deep');
    expect(prop).toBe('value');

    [id, path, prop] = splitPath('element3');
    expect(id).toBe('element3');
    expect(path).not.toBeDefined();
    expect(prop).not.toBeDefined();

    [id, path, prop] = splitPath('element3.value');
    expect(id).toBe('element3');
    expect(path).not.toBeDefined();
    expect(prop).toBe('value');
  });

  test('makeDependencyTree with simple data', () => {
    const simple = getSimple();
    const tree = makeDependencyTree({ getId }, simple);
    expect(tree).toEqual([
      {
        prop: 'id02.value',
        dependsOn: ['id01.value'],
        compute: () => {},
      },
      {
        prop: 'id03.value',
        dependsOn: ['id01.value'],
        compute: () => {},
      },
    ]);
  });

  test('makeDependencyTree with complexDependencies data', () => {
    const tree = makeDependencyTree({ getId }, getComplexDependencies());
    expect(tree).toEqual([
      {
        prop: 'element2.value',
        dependsOn: ['element3.value', 'element1.value', 'element4.value'],
        compute: () => {},
      },
      {
        prop: 'element3.value',
        dependsOn: ['element1.value'],
        compute: () => {},
      },
      {
        prop: 'element4.value',
        dependsOn: ['element1.value', 'element3.value'],
        compute: () => {},
      },
    ]);
  });

  test('makeDependencyTree throws an Error when detecting circular dependencies', () => {
    try {
      makeDependencyTree({ getId }, [
        {
          id: 'el01',
          value: {
            dependsOn: ['el02.value'],
            compute: () => {},
          },
        },
        {
          id: 'el02',
          value: {
            dependsOn: ['el01.value'],
            compute: () => {},
          },
        },
      ]);
    } catch (err) {
      expect(err.message).toBe('Cicular dependencies detected');
    }

    try {
      makeDependencyTree({ getId }, [
        {
          id: 'el01',
          value: {
            dependsOn: ['el02.value'],
            compute: () => {},
          },
        },
        {
          id: 'el02',
          value: {
            dependsOn: ['el03.value'],
            compute: () => {},
          },
        },
        {
          id: 'el03',
          value: {
            dependsOn: ['el01.value'],
            compute: () => {},
          },
        },
      ]);
    } catch (err) {
      expect(err.message).toBe('Cicular dependencies detected');
    }
  });

  test('valid path in dependsOn', () => {
    try {
      makeDependencyTree({ getId }, [
        {
          id: 'el01',
          value: 1,
        },
        {
          id: 'el02',
          value: {
            dependsOn: ['el01'],
            compute: () => {},
          },
        },
      ]);
    } catch (err) {
      expect(err.message).toBe(
        'Invalid path in dependsOn of el02: property must be specified',
      );
    }

    try {
      makeDependencyTree({ getId }, [
        {
          id: 'el01',
          value: 1,
        },
        {
          id: 'el02',
          value: {
            dependsOn: ['el01.prop'],
            compute: () => {},
          },
        },
      ]);
    } catch (err) {
      expect(err.message).toBe(
        'Invalid path in dependsOn of el02: "prop" does not exist',
      );
    }
  });

  test('dependsOn must be a string, an array or a function', () => {
    try {
      makeDependencyTree({ getId }, [
        {
          id: 'el01',
          value: 1,
        },
        {
          id: 'el02',
          value: {
            dependsOn: { obj: true },
            compute: () => {},
          },
        },
      ]);
    } catch (err) {
      expect(err.message).toBe(
        'dependsOn must be a string, an array or a function',
      );
    }
  });

  test('compute property must be a function', () => {
    try {
      makeDependencyTree({ getId }, [
        {
          id: 'el01',
          value: 1,
        },
        {
          id: 'el02',
          value: {
            dependsOn: 'el01.value',
            compute: { obj: true },
          },
        },
      ]);
    } catch (err) {
      expect(err.message).toBe('compute must be a function');
    }
  });

  test('compute simple dependent properties', () => {
    const computed = compute({
      getId,
      arr: [
        {
          id: 'id01',
          value: 'str1',
        },
        {
          id: 'id02',
          value: null,
        },
        {
          id: 'id03',
          value: null,
        },
      ],
      tree: [
        {
          prop: 'id02.value',
          dependsOn: ['id01.value'],
          compute: (item, [el1]) => `${item.id}:${el1.value}.str2`,
        },
        {
          prop: 'id03.value',
          dependsOn: ['id01.value'],
          compute: (item, [el1]) => `${item.id}:${el1.value}.str3`,
        },
      ],
    });
    expect(computed).toBeDefined();
    expect(computed).toHaveLength(3);
    expect(computed[0]).toEqual({ id: 'id01', value: 'str1' });
    expect(computed[1]).toEqual({ id: 'id02', value: 'id02:str1.str2' });
    expect(computed[2]).toEqual({ id: 'id03', value: 'id03:str1.str3' });
  });

  test('compute fields in correct order', () => {
    const computedOrder = [];
    const computeFn = item => {
      computedOrder.push(item.id);
      return true;
    };

    const computed = compute({
      getId,
      arr: [
        {
          id: 'id01',
          computed: false,
        },
        {
          id: 'id02',
          computed: false,
        },
        {
          id: 'id03',
          computed: false,
        },
        {
          id: 'id04',
          computed: false,
        },
      ],
      tree: [
        {
          prop: 'id02.computed',
          dependsOn: ['id01.computed', 'id03.computed'],
          compute: computeFn,
        },
        {
          prop: 'id03.computed',
          dependsOn: ['id04.computed'],
          compute: computeFn,
        },
        {
          prop: 'id04.computed',
          dependsOn: ['id01.computed'],
          compute: computeFn,
        },
      ],
    });
    expect(computed[0]).toEqual({ id: 'id01', computed: false });
    expect(computed[1]).toEqual({ id: 'id02', computed: true });
    expect(computed[2]).toEqual({ id: 'id03', computed: true });
    expect(computedOrder).toEqual(['id04', 'id03', 'id02']);
  });

  test('compute complex dependent properties', () => {
    const computed = compute({
      getId,
      arr: [
        {
          id: 'id01',
          value: 'str1',
        },
        {
          id: 'id02',
          value: null,
        },
        {
          id: 'id03',
          value: null,
          other: 'other3',
        },
      ],
      tree: [
        {
          prop: 'id02.value',
          dependsOn: ['id01.value', 'id03.other', 'id03.value'],
          compute: (item, [el1, el3]) =>
            `${item.id}:${el1.value}.(${el3.value}-${el3.other}).str2`,
        },
        {
          prop: 'id03.value',
          dependsOn: ['id01.value'],
          compute: (item, [el1]) => `${item.id}:${el1.value}.str3`,
        },
      ],
    });
    expect(computed).toBeDefined();
    expect(computed).toHaveLength(3);
    expect(computed[0]).toEqual({ id: 'id01', value: 'str1' });
    expect(computed[1]).toEqual({
      id: 'id02',
      value: 'id02:str1.(id03:str1.str3-other3).str2',
    });
    expect(computed[2]).toEqual({ id: 'id03', value: 'id03:str1.str3' });
  });
});

describe('Lib', () => {
  test('pass array as first argument', () => {
    try {
      kompute({ value: 1 });
    } catch (err) {
      expect(err.message).toBe('First argument must be an Array');
    }
  });
});
