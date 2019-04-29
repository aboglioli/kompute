const omit = require('lodash.omit');

const { makeDependencyTree, orderTree } = require('../lib/kompute');
const { getSimple, getComplexDependencies, getCascadeDependencies } = require('./data');

const compareTree = (originalTree, tree) => {
  expect(originalTree.length).toBe(tree.length);

  originalTree.forEach((originalNode, i) => {
    expect(omit(originalNode, 'compute')).toEqual(omit(tree[i], 'compute'));
  });
};

describe('Dependency tree', () => {
  test('makeDependencyTree with simple data', () => {
    const simple = getSimple();
    const tree = makeDependencyTree(simple);
    compareTree(tree, [
      {
        prop: 'id02.value',
        dependsOn: ['id01.value'],
      },
      {
        prop: 'id03.value',
        dependsOn: ['id01.value'],
      },
    ]);
  });

  test('makeDependencyTree with complexDependencies data', () => {
    const tree = makeDependencyTree(getComplexDependencies());
    compareTree(tree, [
      {
        prop: 'element2.value',
        dependsOn: ['element3.value', 'element1.value', 'element4.value'],
      },
      {
        prop: 'element3.value',
        dependsOn: ['element1.value'],
      },
      {
        prop: 'element4.value',
        dependsOn: ['element1.value', 'element3.value'],
      },
    ]);
  });

  test('makeDependencyTree throws an Error when detecting circular dependencies', () => {
    try {
      makeDependencyTree([
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
      expect(true).toBe(false);
    } catch (err) {
      expect(err.message).toBe('Circular dependencies detected');
    }

    try {
      makeDependencyTree([
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
      expect(true).toBe(false);
    } catch (err) {
      expect(err.message).toBe('Circular dependencies detected');
    }
  });

  test('dependsOn must be a string, an array or a function', () => {
    try {
      makeDependencyTree([
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
      expect(true).toBe(false);
    } catch (err) {
      expect(err.message).toBe(
        'dependsOn must be a string, an array or a function',
      );
    }
  });

  test('compute property must be a function', () => {
    try {
      makeDependencyTree([
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
      expect(true).toBe(false);
    } catch (err) {
      expect(err.message).toBe('compute must be a function');
    }
  });

  test('order simple tree', () => {
    const tree = makeDependencyTree(getSimple());
    const orderedTree = orderTree(tree);
    // TODO: implement test
  });
});
