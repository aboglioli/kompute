const kompute = require('../lib');

const { getSimple, getComplexDependencies } = require('./data');

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
});
