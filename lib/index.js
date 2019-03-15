const { makeDependencyTree, computeAll, wrap } = require('./kompute');

const defaultOptions = {
  getId: item => item.id,
};

module.exports = (arr, options) => {
  if (!Array.isArray(arr)) {
    throw new Error('First argument must be an Array');
  }

  options = { ...defaultOptions, ...options };
  const { getId } = options;

  const tree = makeDependencyTree(arr);
  const computed = computeAll({ getId, tree }, arr);
  const wrapped = wrap({ getId, tree }, computed);

  return wrapped;
};
