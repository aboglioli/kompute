const get = require('lodash.get');
const uniq = require('lodash.uniq');

// Utils
const isKomputeObject = prop => prop.dependsOn && prop.compute;

const findItemById = ({ getId, arr }, id) =>
  arr.find(item => getId(item) === id);

const findNodeByProp = ({ tree }, path, exact = true) =>
  tree.find(node =>
    exact
      ? node.prop === path
      : node.prop.startsWith(path) || path.startsWith(node.prop),
  );

const findNodesByProp = ({ tree }, path, exact = true) =>
  tree.filter(node =>
    exact
      ? node.prop === path
      : node.prop.startsWith(path) || path.startsWith(node.prop),
  );

const findDependentNodes = ({ tree }, path, exact = true) =>
  tree.filter(node =>
    node.dependsOn.some(d =>
      exact ? d === path : d.startsWith(path) || path.startsWith(d),
    ),
  );

const splitPath = (path, join = true) => {
  let [elementId, ...rest] = path.split('.');
  const prop = rest[rest.length - 1];
  rest = rest.slice(0, rest.length - 1);

  return [elementId, join ? rest.join('.') : rest, prop];
};

const getValue = ({ getId, arr }, fullPath) => {
  const [id, path, prop] = splitPath(fullPath);
  let element = findItemById({ getId, arr }, id);

  element = path ? get(element, path) : element;
  return element && (prop ? element[prop] : element);
};

const getElement = ({ getId, arr }, fullPath) => {
  const [id, path, prop] = splitPath(fullPath);
  const item = findItemById({ getId, arr }, id);

  return [item, path ? get(item, path) : item, prop];
};

const checkCircularDependencies = tree => {
  const walkTree = (node, path) => {
    return node.dependsOn.some(dependency => {
      if (
        path.some(
          path => path.startsWith(dependency) || dependency.startsWith(path),
        )
      ) {
        return true;
      }

      const dependencyNode = findNodeByProp({ tree }, dependency, false);

      if (!dependencyNode) {
        return false;
      }

      return walkTree(dependencyNode, [...path, dependencyNode.prop]);
    });
  };

  return tree.some(node => {
    return walkTree(node, [node.prop]);
  });
};

// Make dependency tree
const makeDependencyTree = arr => {
  let tree = [];

  const resolveDependencies = (item, prefix = '') => {
    prefix = prefix || item.id;

    Object.entries(item).forEach(([key, value]) => {
      const path = `${prefix}.${key}`;

      if (!isKomputeObject(value)) {
        if (typeof value === 'object') {
          resolveDependencies(value, path);
        }

        return;
      }

      // Check dependsOn and compute properties
      const dependsOnType = typeof value.dependsOn;
      if (
        dependsOnType !== 'string' &&
        !Array.isArray(value.dependsOn) &&
        dependsOnType !== 'function'
      ) {
        throw new Error('dependsOn must be a string, an array or a function');
      }

      if (typeof value.compute !== 'function') {
        throw new Error('compute must be a function');
      }

      // Add to tree
      const dependsOn = Array.isArray(value.dependsOn)
        ? value.dependsOn
        : dependsOnType === 'string'
        ? [value.dependsOn]
        : value.dependsOn(item);

      tree = [...tree, { prop: path, dependsOn, compute: value.compute }];
    });
  };

  arr.forEach(item => resolveDependencies(item));

  if (checkCircularDependencies(tree)) {
    throw new Error('Circular dependencies detected');
  }

  return tree;
};

// Compute
const computeItem = ({ getId, arr, tree }, node, cache = {}) => {
  const [item, element, prop] = getElement({ getId, arr }, node.prop);

  let dependencies = node.dependsOn.map(dependencyPath => {
    const dependencyNodes = findNodesByProp({ tree }, dependencyPath, false);

    if (dependencyNodes && dependencyNodes.length > 0) {
      dependencyNodes.forEach(dependencyNode => {
        computeItem({ getId, arr, tree }, dependencyNode, cache);
      });
    }

    const [item] = getElement({ getId, arr }, dependencyPath);
    return item;
  });

  dependencies = uniq(dependencies);

  element[prop] = cache[node.prop] || node.compute(item, dependencies);
  cache[node.prop] = element[prop];
};

const computeAll = ({ getId, tree }, arr) => {
  computeFromNodes({ getId, tree, arr }, tree);
  return arr;
};

const computeFromNodes = ({ getId, tree, arr }, nodes) => {
  const cache = {};

  nodes.forEach(node => {
    computeItem({ getId, tree, arr }, node, cache);
  });
};

const wrap = ({ getId, tree }, arr) => {
  let notifyChanges = true;

  const wrapItem = (item, prefix = '') => {
    prefix = prefix || item.id;

    const handlers = {
      set: (target, key, value) => {
        target[key] = value;

        if (notifyChanges) {
          notifyChanges = false;

          const path = `${prefix}.${key}`;

          // Notify changes and update dependent items
          // debugger;
          const dependentNodes = findDependentNodes({ tree }, path, false);
          computeFromNodes({ getId, tree, arr }, dependentNodes);

          notifyChanges = true;
        }

        return true;
      },
    };

    // Wrap properties recursively
    item = Object.entries(item).reduce((newObj, [key, value]) => {
      if (typeof value === 'object') {
        if (!isKomputeObject(value)) {
          const path = `${prefix}.${key}`;

          const dependentNodes = findDependentNodes({ tree }, path, false);
          if (dependentNodes.length > 0) {
            value = wrapItem(value, `${prefix}.${key}`);
          }
        }
      }

      return {
        ...newObj,
        [key]: value,
      };
    }, {});

    return new Proxy(item, handlers);
  };

  // Arr has to be reassigned to keep the same reference that returned array
  arr = arr.map(item => wrapItem(item));
  return arr;
};

module.exports = {
  findItemById,
  findNodeByProp,
  findNodesByProp,
  findDependentNodes,
  splitPath,
  getValue,
  getElement,
  checkCircularDependencies,
  makeDependencyTree,
  computeAll,
  wrap,
};
