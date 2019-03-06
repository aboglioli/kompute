const { isKomputeObject } = require('./utils');

const defaultOptions = {
  getId: item => item.id,
};

class Kompute {
  constructor(arr, options) {
    this.arr = arr;
    options = { ...defaultOptions, options };
    this.getId = options.getId;
  }

  wrap(target, prefix = '') {
    prefix = prefix || target.id;

    const handlers = {
      get: (target, key) => {
        const value = target[key];

        if (typeof key !== 'string') {
          return value;
        }

        // const path = `${prefix}.${key}`;

        if (key === 'isObserved') {
          return true;
          // return this.proxiedProperties.some(prop => prop === path);
        }

        return value;
      },
    };

    target = Object.entries(target).reduce((newObj, [key, value]) => {
      if (typeof value === 'object') {
        if (isKomputeObject(value)) {
          const dependsOn = Array.isArray(value.dependsOn)
            ? value.dependsOn
            : value.dependsOn(target);
        } else {
          value = this.wrap(value, `${prefix}.${key}`);
        }
      }

      return {
        ...newObj,
        [key]: value,
      };
    }, {});

    return new Proxy(target, handlers);
  }
}

module.exports = Kompute;
