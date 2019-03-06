const isKomputeObject = prop => prop.dependsOn && prop.compute;

const normalizeArray = (arr, getId) =>
  arr.reduce((obj, item) => ({ ...obj, [getId(item)]: item }), {});

const getPathId = path => {
  const pathArr = path.split('.');
  return pathArr.length > 0 ? pathArr[0] : null;
};

/***
 * Initial computation
 */
const findItemById = (id, arr) => {
  return arr.find(item => item.id === id);
};

/***
 * Dependency tree
 */
const computeDependencies = (arr, item, tree = {}, prefix = '') => {
  prefix = prefix || item.id;

  Object.entries(item).forEach(([key, value]) => {
    const path = `${prefix}.${key}`;

    if (!isKomputeObject(value)) {
      if (typeof value === 'object') {
        computeDependencies(arr, value, tree, path);
      }

      return;
    }

    const dependsOn = Array.isArray(value.dependsOn)
      ? value.dependsOn
      : value.dependsOn(item);

    dependsOn.forEach(dependency => {
      tree[dependency] = tree[dependency]
        ? [...tree[dependency], path]
        : [path];
    });

    const dependencies = dependsOn.map(path =>
      findItemById(getPathId(path), arr),
    );
    item[key] = value.compute(item, dependencies);
  });

  return tree;
};

const makeDependencyTree = arr => {
  return arr.reduce((tree, item) => {
    computeDependencies(arr, item, tree);
    return tree;
  }, {});
};

module.exports = {
  isKomputeObject,
  normalizeArray,
  makeDependencyTree,
};
