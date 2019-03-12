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

const findDependentNodes = ({ tree }, path, exact = true) =>
  tree.filter(node =>
    node.dependsOn.some(d => (exact ? d === path : d.startsWith(path))),
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
  let element = findItemById({ getId, arr }, id);

  return [path ? get(element, path) : element, prop];
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
const compute = ({ getId, tree }, arr) => {
  const cache = {};

  const computeItem = node => {
    const [id, path, prop] = splitPath(node.prop);
    const item = findItemById({ getId, arr }, id);
    const element = path ? get(item, path) : item;

    let dependencies = node.dependsOn.map(dependencyPath => {
      const dependencyNode = findNodeByProp({ tree }, dependencyPath);

      if (dependencyNode) {
        computeItem(dependencyNode);
      }

      const [id] = splitPath(dependencyPath);
      return findItemById({ getId, arr }, id);
    });

    dependencies = uniq(dependencies);

    element[prop] = cache[node.prop] || node.compute(item, dependencies);
    cache[node.prop] = element[prop];
  };

  tree.forEach(node => {
    computeItem(node);
  });

  return arr;
};

const wrap = self => self.arr.map(item => wrapItem(self, item));

const wrapItem = (self, item, prefix = '') => {
  prefix = prefix || item.id;

  const handlers = {
    get: (target, key) => {
      const value = target[key];

      if (typeof key !== 'string') {
        return value;
      }

      const path = `${prefix}.${key}`;

      if (key === 'isObserved') {
        const [id] = splitPath(path);
        if (
          self.tree.some(item =>
            item.dependsOn.some(dependency => dependency.startsWith(id)),
          )
        ) {
          return true;
        }

        return false;
      }

      if (key === 'observedBy') {
        const [id] = splitPath(path);
        return self.tree
          .filter(item =>
            item.dependsOn.some(dependency => dependency.startsWith(id)),
          )
          .reduce((arr, item) => {
            return [...arr, `${item.prop}`];
          }, []);
      }

      return value;
    },
  };

  item = Object.entries(item).reduce((newObj, [key, value]) => {
    if (typeof value === 'object') {
      if (!isKomputeObject(value)) {
        const path = `${prefix}.${key}`;

        if (self.tree.some(node => node.dependsOn.includes(path))) {
          value = wrapItem(self, value, `${prefix}.${key}`);
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

module.exports = {
  findItemById,
  findNodeByProp,
  findDependentNodes,
  splitPath,
  getValue,
  getElement,
  checkCircularDependencies,
  makeDependencyTree,
  compute,
  wrap,
};
