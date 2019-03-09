const isKomputeObject = prop => prop.dependsOn && prop.compute;

const splitPath = (path, join = true) => {
  const [elementId, ...rest] = path.split('.');

  return [elementId, join ? rest.join('.') : rest];
};

const defaultOptions = {
  getId: item => item.id,
  makeDependencyTree: true,
  initialComputation: true,
};

class Kompute {
  constructor(arr, options) {
    this.arr = arr;
    this.options = { ...defaultOptions, ...options };
    this.getId = this.options.getId;
    this.tree = [];

    if (this.options.makeDependencyTree) {
      this.makeDependencyTree();
    }
  }

  findItemById(id) {
    return this.arr.find(item => this.getId(item) === id);
  }

  makeDependencyTree() {
    this.arr.forEach(item => {
      this.computeDependencies(item);
    }, {});
  }

  computeDependencies(item, prefix = '') {
    prefix = prefix || item.id;

    Object.entries(item).forEach(([key, value]) => {
      const path = `${prefix}.${key}`;

      if (!isKomputeObject(value)) {
        if (typeof value === 'object') {
          this.computeDependencies(value, path);
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

      this.tree = [
        ...this.tree,
        { prop: path, dependsOn, compute: value.compute },
      ];

      const dependencies = dependsOn.map(path => {
        const [id] = splitPath(path);
        return this.findItemById(id);
      });

      // First computation
      if (this.options.initialComputation) {
        item[key] = value.compute(item, dependencies);
      }
    });
  }

  wrap() {
    return this.arr.map(item => this.wrapItem(item));
  }

  wrapItem(item, prefix = '') {
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
            this.tree.some(item =>
              item.dependsOn.some(dependency => dependency.startsWith(id)),
            )
          ) {
            return true;
          }

          return false;
        }

        if (key === 'observedBy') {
          return [];
        }

        return value;
      },
    };

    item = Object.entries(item).reduce((newObj, [key, value]) => {
      if (typeof value === 'object') {
        if (!isKomputeObject(value)) {
          const path = `${prefix}.${key}`;

          if (this.tree.some(node => node.dependsOn.includes(path))) {
            value = this.wrapItem(value, `${prefix}.${key}`);
          }
        }
      }

      return {
        ...newObj,
        [key]: value,
      };
    }, {});

    return new Proxy(item, handlers);
  }
}

module.exports = Kompute;
