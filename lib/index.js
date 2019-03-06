const Kompute = require('./kompute');

module.exports = (arr, options) => {
  if (!Array.isArray(arr)) {
    throw new Error('First argument should be an Array');
  }

  const kompute = new Kompute(arr, options);

  return arr.map(item => kompute.wrap(item));
};
