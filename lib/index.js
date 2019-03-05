const wrap = (target, path = '') => {
  const handlers = {
    get: (target, key) => {
      if (key === 'isProxied') {
        return true;
      }

      const value = target[key];

      path = path ? `${path}.${key}` : key;
      console.log(path);

      if (typeof value === 'object') {
        return wrap(value, path);
      }

      return target[key];
    },
    set: (target, key, value) => {
      console.log(path);
      target[key] = value;
      return true;
    },
  };

  return new Proxy(target, handlers);
};

const db = {
  data: {
    cost: {
      value: 1,
      quantity: {
        value: 2,
        unit: 'kg',
      },
    },
  },
};

const p = wrap(db);

const defaultOptions = {
  getId: item => item.id,
};

const kompute = (arr, options) => {
  if (!Array.isArray(arr)) {
    throw new Error('First argument should be an Array');
  }

  options = { ...defaultOptions, ...options };

  return arr.map(item => wrap(item));
};

module.exports = kompute;
