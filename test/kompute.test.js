const {
  findItemById,
  findNodeByProp,
  findDependentNodes,
  splitPath,
  makeDependencyTree,
  compute,
  wrap,
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

  test('compute complex and deep dependent properties', () => {
    const tree = [
      {
        prop: 'id02.data.result.value',
        dependsOn: [
          'id01.data.value',
          'id01.data.subdata.multiplier',
          'id03.data.result.value',
        ],
        compute: jest.fn(
          (item, [el1, el3]) =>
            el1.data.value *
            el1.data.subdata.multiplier *
            el3.data.result.value,
        ), // 3 * 2 * 4 = 24
      },
      {
        prop: 'id03.data.result.value',
        dependsOn: ['id01.data.value'],
        compute: (item, [el1]) => el1.data.value + 1, // 4
      },
    ];

    const computed = compute({
      getId,
      arr: [
        {
          id: 'id01',
          data: {
            value: 3,
            subdata: {
              multiplier: 2,
            },
          },
        },
        {
          id: 'id02',
          data: { result: { value: 0 } },
        },
        {
          id: 'id03',
          data: { result: { value: 0 } },
        },
      ],
      tree,
    });
    expect(computed).toBeDefined();
    expect(computed).toHaveLength(3);
    expect(computed[0]).toEqual({
      id: 'id01',
      data: { value: 3, subdata: { multiplier: 2 } },
    });
    expect(computed[1]).toEqual({
      id: 'id02',
      data: {
        result: {
          value: 24,
        },
      },
    });
    expect(computed[2]).toEqual({
      id: 'id03',
      data: {
        result: {
          value: 4,
        },
      },
    });

    expect(tree[0].compute.mock.calls.length).toBe(1);
    expect(tree[0].compute.mock.calls[0][1]).toHaveLength(2);
    expect(tree[0].compute.mock.results[0].value).toBe(24);

    expect(tree[1].compute.mock.calls.length).toBe(1);
    expect(tree[1].compute.mock.calls[0][1]).toHaveLength(1);
    expect(tree[1].compute.mock.results[0].value).toBe(4);
  });

  test('wrap and update item directly', () => {
    let calls = 0;
    const wrapped = wrap({
      getId,
      arr: [
        {
          id: 'id01',
          data: 23,
          multiplier: 2,
        },
        {
          id: 'id02',
          data: 0,
        },
      ],
      tree: [
        {
          prop: 'id02.data',
          dependsOn: ['id01.data'],
          compute: (_, [el1]) => {
            calls++;
            return el1.data * el1.multiplier;
          },
        },
      ],
    });
    expect(wrapped[1].data).toBe(0);

    wrapped[0].data = 15;
    expect(wrapped[1].data).toBe(30);

    // item 1 is not watching for changes on "multiplier"
    wrapped[0].multiplier = 3;
    expect(wrapped[1].data).toBe(30);

    wrapped[0].data = 20;
    expect(wrapped[1].data).toBe(60);

    expect(calls).toBe(2);
  });

  test('wrap deep dependencies and update item indirectly', () => {
    const tree = [
      {
        prop: 'id02.data.value',
        dependsOn: ['id01.data.value', 'id01.data.multiplier'],
        compute: jest.fn((_, [el1]) => el1.data * el1.multiplier),
      },
    ];

    const wrapped = wrap({
      getId,
      arr: [
        {
          id: 'id01',
          data: {
            value: 12,
            multiplier: 2,
          },
        },
        {
          id: 'id02',
          data: {
            value: 24,
          },
        },
      ],
      tree,
    });
    expect(wrapped[1].data).toEqual({ value: 24 });

    wrapped[0].data.value = 15;
    expect(wrapped[1].data).toEqual({ value: 30 });

    wrapped[0].data.multiplier = 3;
    expect(wrapped[1].data).toEqual({ value: 45 });

    wrapped[0].data = { value: 5, multiplier: 2 };
    expect(wrapped[1].data).toEqual({ value: 10 });

    expect(tree[0].mock.calls.length).toBe(3);
    expect(tree[0].mock.calls[0][1].length).toBe(1);
    expect(tree[0].mock.calls[1][1].length).toBe(1);
    expect(tree[0].mock.calls[2][1].length).toBe(1);
    expect(tree[0].mock.results[0].value).toBe(30);
    expect(tree[0].mock.results[1].value).toBe(45);
    expect(tree[0].mock.results[2].value).toBe(10);
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
