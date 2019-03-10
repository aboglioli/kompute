const Kompute = require('./kompute');

const defaultOptions = {
  getId: item => item.id,
  makeDependencyTree: true,
  initialComputation: true,
};

module.exports = (arr, options) => {
  if (!Array.isArray(arr)) {
    throw new Error('First argument should be an Array');
  }

  options = { ...defaultOptions, ...options };

  const kompute = new Kompute(arr, options);
  return kompute.wrap();
};
