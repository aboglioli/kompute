const { getSimple, getDeepFields } = require('./data');
const { normalizeArray, makeDependencyTree } = require('../lib/utils');

describe('Helpers', () => {
  test('normalizeArray', () => {
    const simple = getSimple();
    const n = normalizeArray(simple, item => item.id);
    expect(Array.isArray(n)).toBe(false);
    expect(typeof n).toBe('object');
    expect(Object.keys(n)).toEqual(['element1', 'element2', 'element3']);
    expect(n.element1).toEqual(simple[0]);
  });

  test('makeDependencyTree', () => {
    let tree = makeDependencyTree([{ id: 'one' }, { id: 'two' }]);
    expect(tree).toEqual({});

    tree = makeDependencyTree(getSimple());
    expect(tree).toEqual({
      'element1.value': ['element2.value', 'element3.value'],
      'element2.value': ['element3.value'],
    });

    tree = makeDependencyTree(getDeepFields());
    expect(tree).toEqual({
      '001.data.value': ['002.data.value', '003.data.value'],
      '002.data.value': ['003.data.value'],
    });
  });

  test('computeDependencies before making dependency tree', () => {
    const arr = [
      {
        id: 'one',
        value: 5,
      },
      {
        id: 'two',
        value: {
          dependsOn: ['one'],
          compute: (item, [one]) => one.value * 2,
        },
      },
    ];

    makeDependencyTree(arr);

    expect(arr[1]).toEqual({ id: 'two', value: 10 });
  });
});
