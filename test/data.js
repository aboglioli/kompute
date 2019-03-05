const cloneDeep = require('lodash.clonedeep');

const { calculateCost } = require('./helpers');

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

const simple = [
  {
    id: 'element1',
    value: 2,
  },
  {
    id: 'element2',
    value: {
      dependsOn: ['element1.value'],
      compute: (_, [firstItem]) => firstItem.value * 2,
    },
  },
  {
    id: 'element3',
    relatedTo: 'element1',
    value: {
      dependsOn: item => [`${item.relatedTo}.value`],
      compute: (_, [firstItem]) => firstItem.value * 3,
    },
  },
];

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
        compute: (item, [firstItem]) => `${item.id}.${firstItem.id}`,
      },
    },
  },
];

module.exports = {
  getProducts: () => cloneDeep(products),
  getSimple: () => cloneDeep(simple),
  getDeepFields: () => cloneDeep(deepFields),
};
