const kompute = require('../lib');

const {
  getSimple,
  getComplexDependencies,
  getDeepFields,
  getProducts,
} = require('./data');

describe('Lib', () => {
  test('pass array as first argument', () => {
    try {
      kompute({ value: 1 });
      expect(true).toBe(false);
    } catch (err) {
      expect(err.message).toBe('First argument must be an Array');
    }
  });

  test('simple data', () => {
    const data = kompute(getSimple());
    expect(data).toEqual([
      {
        id: 'id01',
        value: 2,
      },
      {
        id: 'id02',
        value: 4,
      },
      {
        id: 'id03',
        value: 6,
      },
    ]);

    data[0].value = 5;
    expect(data[1].value).toBe(10);
    expect(data[2].value).toBe(15);
  });

  test('complex dependencies', () => {
    const data = kompute(getComplexDependencies());
    expect(data).toEqual([
      {
        id: 'element1',
        value: 2,
      },
      {
        id: 'element2',
        relatedTo: 'element3',
        value: 24,
      },
      {
        id: 'element3',
        value: 6,
      },
      {
        id: 'element4',
        value: 12,
      },
    ]);

    const objToChange = data[0];
    objToChange.value = 5;

    // value3 = value1 * 3
    expect(data[2].value).toBe(5 * 3);

    // value4 = value 1 * value3
    expect(data[3].value).toBe(5 * (5 * 3));

    // value2 = value3 * value1 + value4
    expect(data[1].value).toBe(5 * 3 * 5 + 5 * (5 * 3));

    objToChange.value = 6;

    // value3 = value1 * 3
    expect(data[2].value).toBe(6 * 3);

    // value4 = value 1 * value3
    expect(data[3].value).toBe(6 * (6 * 3));

    // value2 = value3 * value1 + value4
    expect(data[1].value).toBe(6 * 3 * 6 + 6 * (6 * 3));
  });

  test('deep fields', () => {
    const data = kompute(getDeepFields());
    expect(data).toEqual([
      {
        id: '001',
        data: {
          value: 9,
        },
      },
      {
        id: '002',
        data: {
          value: 2 * 9,
        },
      },
      {
        id: '003',
        data: {
          value: 9 + 18,
        },
      },
    ]);

    data[0].data.value = 10;

    expect(data).toEqual([
      {
        id: '001',
        data: {
          value: 10,
        },
      },
      {
        id: '002',
        data: {
          value: 2 * 10,
        },
      },
      {
        id: '003',
        data: {
          value: 10 + 20,
        },
      },
    ]);
  });

  test('products', () => {
    const data = kompute(getProducts());

    expect(data).toEqual([
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
        cost: {
          value: 15,
          quantity: {
            value: 1,
            unit: 'u',
          },
        }, // $15
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
        cost: {
          value: 35,
          quantity: {
            value: 1,
            unit: 'u',
          },
        }, // $35
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
        cost: {
          value: 77.5,
          quantity: {
            value: 1,
            unit: 'u',
          },
        }, // $77.5
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
    ]);

    // Change product1 cost
    // $5 x 1 kg === $10 x 2000 g
    data[0].cost = {
      value: 10,
      quantity: {
        value: 2000,
        unit: 'g',
      },
    };

    expect(data[2]).toEqual({
      id: 'product3',
      name: 'Product 3',
      cost: {
        value: 15,
        quantity: {
          value: 1,
          unit: 'u',
        },
      },
      composition: [
        {
          of: 'product1',
          quantity: {
            value: 2000,
            unit: 'g',
          },
        },
        {
          of: 'product2',
          quantity: {
            value: 0.25,
            unit: 'kg',
          },
        },
      ],
    });

    // Change product2 cost
    data[1].cost = {
      value: 20,
      quantity: {
        value: 100,
        unit: 'g',
      },
    };

    expect(data[2]).toEqual({
      id: 'product3',
      name: 'Product 3',
      cost: {
        value: 2 * (5 / 1) + 0.25 * (20 / 0.1), // $60
        quantity: {
          value: 1,
          unit: 'u',
        },
      },
      composition: [
        {
          of: 'product1',
          quantity: {
            value: 2000,
            unit: 'g',
          },
        },
        {
          of: 'product2',
          quantity: {
            value: 0.25,
            unit: 'kg',
          },
        },
      ],
    });

    expect(data[3]).toEqual({
      id: 'product4',
      name: 'Product 4',
      cost: {
        value: 0.25 * (20 / 0.1) + 2 * 60, // $120.5
        quantity: {
          value: 1,
          unit: 'u',
        },
      },
      composition: [
        {
          of: 'product2',
          quantity: {
            value: 250,
            unit: 'g',
          },
        },
        {
          of: 'product3',
          quantity: {
            value: 2,
            unit: 'u',
          },
        },
      ],
    });

    expect(data[4]).toEqual({
      id: 'product5',
      name: 'Product 5',
      cost: {
        value: 0.5 * 60 + 2 * 120.5, // $271
        quantity: {
          value: 1,
          unit: 'u',
        },
      },
      composition: [
        {
          of: 'product3',
          quantity: {
            value: 0.5,
            unit: 'u',
          },
        },
        {
          of: 'product4',
          quantity: {
            value: 2,
            unit: 'u',
          },
        },
      ],
    });
  });
});
