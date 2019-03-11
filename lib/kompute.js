const get = require('lodash.get');

const isKomputeObject = prop => prop.dependsOn && prop.compute;

const findItemById = ({ arr, getId }, id) =>
  arr.find(item => getId(item) === id);

const findNodeByProp = ({ tree }, path, exact = true) =>
  tree.find(node => (exact ? node.prop === path : node.prop.startsWith(path)));

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

const makeDependencyTree = store =>
  store.arr.forEach(item => resolveDependencies(store, item));

const resolveDependencies = (store, item, prefix = '') => {
  prefix = prefix || item.id;

  Object.entries(item).forEach(([key, value]) => {
    const path = `${prefix}.${key}`;

    if (!isKomputeObject(value)) {
      if (typeof value === 'object') {
        resolveDependencies(store, value, path);
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
      throw new Error(
        `"dependsOn" must be a string, an array or a function. Found "${dependsOnType}" on ${path}`,
      );
    }

    if (typeof value.compute !== 'function') {
      throw new Error(
        `"compute" must be a function. Found "${typeof value.compute}" on ${path}`,
      );
    }

    // Add to tree
    const dependsOn = Array.isArray(value.dependsOn)
      ? value.dependsOn
      : dependsOnType === 'string'
      ? [value.dependsOn]
      : value.dependsOn(item);

    store.tree = [
      ...store.tree,
      { prop: path, dependsOn, compute: value.compute },
    ];

    const dependencies = dependsOn.map(path => {
      const [id] = splitPath(path);
      return findItemById(store, id);
    });

    // First computation
    if (store.options.initialComputation) {
      item[key] = value.compute(item, dependencies);
    }
  });
};

const computeItem = (store, fullPath) => {
  const node = store.tree.find(node => node.prop === fullPath);
  if (!node) {
    throw new Error(`${fullPath} is not a computed property`);
  }

  const [id, path, prop] = splitPath(fullPath);
  const element = findItemById(store, id);
  const data = path ? get(element, path) : element;

  const dependencies = node.dependsOn.map(dependency => {
    if (store.tree.some(node => node.prop === dependency)) {
      store.computeItem(store, dependency);
    }

    const [id] = splitPath(dependency);
    return findItemById(store, id);
  });

  data[prop] = node.compute(element, dependencies);
};

const wrap = store => store.arr.map(item => wrapItem(store, item));

const wrapItem = (store, item, prefix = '') => {
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
          store.tree.some(item =>
            item.dependsOn.some(dependency => dependency.startsWith(id)),
          )
        ) {
          return true;
        }

        return false;
      }

      if (key === 'observedBy') {
        const [id] = splitPath(path);
        return store.tree
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

        if (store.tree.some(node => node.dependsOn.includes(path))) {
          value = wrapItem(store, value, `${prefix}.${key}`);
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
  makeDependencyTree,
};
