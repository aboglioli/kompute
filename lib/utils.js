const isKomputeObject = prop => prop.dependsOn && prop.compute;

const normalizeArray = (arr, getId) =>
  arr.reduce((obj, item) => ({ ...obj, [getId(item)]: item }), {});

const makeDependencyTree = (arr, resolvers, getId) => {
  return Object.keys(resolvers).map(key => {
    const resolver = resolvers[key];

    const tree = arr.reduce((tree, item) => {
      const dependencies = resolver.dependsOn(item);

      if (!dependencies) {
        return tree;
      }

      const itemId = getId(item);

      dependencies.forEach(dependency => {
        tree[dependency] = tree[dependency]
          ? [...tree[dependency], itemId]
          : [itemId];
      });

      return tree;
    }, {});

    return {
      prop: key,
      dependencies: tree,
      ...resolver,
    };
  });
};

module.exports = {
  isKomputeObject,
  normalizeArray,
  makeDependencyTree,
};
