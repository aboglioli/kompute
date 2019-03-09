const cloneDeep = require('lodash.clonedeep');

// Products: complex example
const units = {
  kg: 1000,
  g: 1,
  u: 1, // dimensionless unit
};

const normalize = (value, unitName) => value * units[unitName];

const calculateCost = (quantity, cost) => {
  // normalized quantity value
  const nQuantityValue = normalize(quantity.value, quantity.unit);
  // normalized cost quantity value
  const nCostQuantityValue = normalize(cost.quantity.value, cost.quantity.unit);

  return nQuantityValue * (cost.value / nCostQuantityValue);
};

const computedCost = {
  dependsOn: item => item.composition.map(comp => `${comp.of}.cost`),
  compute: (item, products) => {
    const costValue = item.composition.reduce((cost, comp, i) => {
      return cost + calculateCost(comp.quantity, products[i].cost);
    }, 0);

    return {
      value: costValue,
      quantity: {
        value: 1,
        unit: 'u',
      },
    };
  },
};

const products = [
  {
    id: 'product1',
    name: 'Product 1',
    cost: {
      value: 5,
      quantity: {
        value: 1,
        unit: 'kg',
      },
    },
  },
  {
    id: 'product2',
    name: 'Product 2',
    cost: {
      value: 10,
      quantity: {
        value: 500,
        unit: 'g',
      },
    },
  },
  {
    id: 'product3',
    name: 'Product 3',
    cost: computedCost, // $15
    composition: [
      {
        // $10
        of: 'product1',
        quantity: {
          value: 2000,
          unit: 'g',
        },
      },
      {
        // $5
        of: 'product2',
        quantity: {
          value: 0.25,
          unit: 'kg',
        },
      },
    ],
  },
  {
    id: 'product4',
    name: 'Product 4',
    cost: computedCost, // $35
    composition: [
      {
        // $5
        of: 'product2',
        quantity: {
          value: 250,
          unit: 'g',
        },
      },
      {
        // $30
        of: 'product3',
        quantity: {
          value: 2,
          unit: 'u',
        },
      },
    ],
  },
  {
    id: 'product5',
    name: 'Product 5',
    cost: computedCost, // $77.5
    composition: [
      {
        // $7.5
        of: 'product3',
        quantity: {
          value: 0.5,
          unit: 'u',
        },
      },
      {
        // $70
        of: 'product4',
        quantity: {
          value: 2,
          unit: 'u',
        },
      },
    ],
  },
];

// Simple
const simple = [
  {
    id: 'id01',
    value: 2,
  },
  {
    id: 'id02',
    value: {
      dependsOn: ['id01.value'],
      compute: (_, [id01]) => id01.value * 2,
    },
  },
  {
    id: 'id03',
    value: {
      dependsOn: 'id01.value',
      compute: (_, [id01]) => id01.value * 3,
    },
  },
];

// Dependency between kompute objects
const complexDependencies = [
  {
    id: 'element1',
    value: 2,
  },
  {
    id: 'element2',
    relatedTo: 'element3',
    value: {
      dependsOn: item => [`${item.relatedTo}.value`, 'element1.value'],
      compute: (_, [element3, element1]) => element3.value * element1.value, // 6 + 2
    },
  },
  {
    id: 'element3',
    value: {
      dependsOn: ['element1.value'],
      compute: (_, [element1]) => element1.value * 3, // 6
    },
  },
];

// Deep fields
const deepFields = [
  {
    id: '001',
    data: {
      value: 9,
    },
  },
  {
    id: '002',
    data: {
      value: {
        dependsOn: ['001.data.value'],
        compute: (item, [firstItem]) => firstItem.data.value * 2, // 18
      },
    },
  },
  {
    id: '003',
    data: {
      value: {
        dependsOn: ['001.data.value', '002.data.value'],
        compute: (item, [one, two]) => one.data.value + two.data.value, // 9 + 18
      },
    },
  },
];

module.exports = {
  getProducts: () => cloneDeep(products),
  getSimple: () => cloneDeep(simple),
  getComplexDependencies: () => cloneDeep(complexDependencies),
  getDeepFields: () => cloneDeep(deepFields),
};
