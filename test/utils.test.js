const {
  findItemById,
  findNodeByProp,
  findNodesByProp,
  findDependentNodes,
  splitPath,
  getValue,
  getElement,
} = require('../lib/kompute');

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

  test('findNodesByProp', () => {
    const tree = [
      {
        prop: 'el1.data.subdata.value',
        dependsOn: ['element2.value'],
        compute: (item, [element1]) => element1.value * 2,
      },
      {
        prop: 'el1.data.subdata.multiplier',
        dependsOn: ['element2.value'],
        compute: (item, [element1]) => element1.value * 2,
      },
      {
        prop: 'el1.data',
        dependsOn: ['element2.value'],
        compute: (item, [element1]) => element1.value * 2,
      },
    ];
    // with exact path
    let nodes = findNodesByProp({ tree }, 'el1.data', true);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toEqual(tree[2]);

    // with relative path
    nodes = findNodesByProp({ tree }, 'el1.data', false);
    expect(nodes).toHaveLength(3);
    expect(nodes).toEqual(tree);

    nodes = findNodesByProp({ tree }, 'el1.data.subdata');
    expect(nodes).toHaveLength(0);

    nodes = findNodesByProp({ tree }, 'el1.data.subdata', false);
    expect(nodes).toHaveLength(3);
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
    expect(path).toBe('');
    expect(prop).not.toBeDefined();

    [id, path, prop] = splitPath('element3.value');
    expect(id).toBe('element3');
    expect(path).toBe('');
    expect(prop).toBe('value');
  });

  test('getValue and getElement', () => {
    const arr = [
      {
        id: 'id01',
        value: 123,
      },
      {
        id: 'id02',
        data: {
          value: 124,
        },
      },
      {
        id: 'id03',
        data: {
          subdata: {
            value: 125,
          },
          multiplier: 126,
        },
      },
    ];

    // Value
    expect(getValue({ getId, arr }, 'id01.value')).toBe(123);
    expect(getValue({ getId, arr }, 'id02.data.value')).toBe(124);
    expect(getValue({ getId, arr }, 'id03.data.subdata.value')).toBe(125);
    expect(getValue({ getId, arr }, 'id03.data.multiplier')).toBe(126);
    expect(getValue({ getId, arr }, 'id03.data.subdata')).toEqual({
      value: 125,
    });
    expect(getValue({ getId, arr }, 'id01')).toEqual(arr[0]);
    expect(getValue({ getId, arr }, 'id02')).toEqual(arr[1]);
    expect(getValue({ getId, arr }, 'id03')).toEqual(arr[2]);

    expect(getValue({ getId, arr }, 'id03.data.other')).not.toBeDefined();
    expect(
      getValue({ getId, arr }, 'id03.data.subdata.other'),
    ).not.toBeDefined();
    expect(getValue({ getId, arr }, 'id04.value')).not.toBeDefined();
    expect(getValue({ getId, arr }, 'id05')).not.toBeDefined();
    expect(getValue({ getId, arr }, '')).not.toBeDefined();

    // Element
    expect(getElement({ getId, arr }, 'id01.value')).toEqual([
      arr[0],
      { id: 'id01', value: 123 },
      'value',
    ]);
    expect(getElement({ getId, arr }, 'id03.data.subdata.value')).toEqual([
      arr[2],
      { value: 125 },
      'value',
    ]);
    expect(getElement({ getId, arr }, 'id03.data.multiplier')).toEqual([
      arr[2],
      { subdata: { value: 125 }, multiplier: 126 },
      'multiplier',
    ]);

    expect(getElement({ getId, arr }, 'id04.data.other')).toEqual([
      undefined,
      undefined,
      'other',
    ]);
  });
});
