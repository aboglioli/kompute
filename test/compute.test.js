const { makeDependencyTree, computeAll } = require('../lib/kompute');
const { getComplexDependencies } = require('./data');

const getId = item => item.id;

describe('Compute', () => {
  test('compute simple dependent properties', () => {
    const computed = computeAll(
      {
        getId,
        tree: [
          {
            prop: 'id02.value',
            dependsOn: ['id01.value'],
            compute: (item, [el1]) => `${item.id}:${el1.value}.str2`,
          },
          {
            prop: 'id03.value',
            dependsOn: ['id01.value'],
            compute: (item, [el1]) => `${item.id}:${el1.value}.str3`,
          },
        ],
      },
      [
        {
          id: 'id01',
          value: 'str1',
        },
        {
          id: 'id02',
          value: null,
        },
        {
          id: 'id03',
          value: null,
        },
      ],
    );
    expect(computed).toBeDefined();
    expect(computed).toHaveLength(3);
    expect(computed[0]).toEqual({ id: 'id01', value: 'str1' });
    expect(computed[1]).toEqual({ id: 'id02', value: 'id02:str1.str2' });
    expect(computed[2]).toEqual({ id: 'id03', value: 'id03:str1.str3' });
  });

  test('compute fields in correct order', () => {
    const computedOrder = [];
    const computeFn = item => {
      computedOrder.push(item.id);
      return true;
    };

    const computed = computeAll(
      {
        getId,
        tree: [
          {
            prop: 'id03.computed',
            dependsOn: ['id04.computed'],
            compute: computeFn,
          },
          {
            prop: 'id02.computed',
            dependsOn: ['id01.computed', 'id03.computed'],
            compute: computeFn,
          },
          {
            prop: 'id04.computed',
            dependsOn: ['id01.computed'],
            compute: computeFn,
          },
        ],
      },
      [
        {
          id: 'id01',
          computed: false,
        },
        {
          id: 'id02',
          computed: false,
        },
        {
          id: 'id03',
          computed: false,
        },
        {
          id: 'id04',
          computed: false,
        },
      ],
    );
    expect(computed[0]).toEqual({ id: 'id01', computed: false });
    expect(computed[1]).toEqual({ id: 'id02', computed: true });
    expect(computed[2]).toEqual({ id: 'id03', computed: true });
    expect(computedOrder).toEqual(['id04', 'id03', 'id02']);
  });

  test('compute complex dependent properties', () => {
    const computed = computeAll(
      {
        getId,
        tree: [
          {
            prop: 'id02.value',
            dependsOn: ['id01.value', 'id03.other', 'id03.value'],
            compute: (item, [el1, el3]) =>
              `${item.id}:${el1.value}.(${el3.value}-${el3.other}).str2`,
          },
          {
            prop: 'id03.value',
            dependsOn: ['id01.value'],
            compute: (item, [el1]) => `${item.id}:${el1.value}.str3`,
          },
        ],
      },
      [
        {
          id: 'id01',
          value: 'str1',
        },
        {
          id: 'id02',
          value: null,
        },
        {
          id: 'id03',
          value: null,
          other: 'other3',
        },
      ],
    );
    expect(computed).toBeDefined();
    expect(computed).toHaveLength(3);
    expect(computed[0]).toEqual({ id: 'id01', value: 'str1' });
    expect(computed[1]).toEqual({
      id: 'id02',
      value: 'id02:str1.(id03:str1.str3-other3).str2',
    });
    expect(computed[2]).toEqual({
      id: 'id03',
      value: 'id03:str1.str3',
      other: 'other3',
    });
  });

  test('compute complex and deep dependent properties', () => {
    const tree = [
      {
        prop: 'id02.data.result.value',
        dependsOn: [
          'id01.data.value',
          'id01.data.subdata.multiplier',
          'id03.data.result.value',
        ],
        compute: jest.fn(
          (item, [el1, el3]) =>
            el1.data.value *
            el1.data.subdata.multiplier *
            el3.data.result.value,
        ), // 3 * 2 * 4 = 24
      },
      {
        prop: 'id03.data.result.value',
        dependsOn: ['id01.data.value'],
        compute: jest.fn((item, [el1]) => el1.data.value + 1), // 4
      },
    ];

    const computed = computeAll(
      {
        getId,
        tree,
      },
      [
        {
          id: 'id01',
          data: {
            value: 3,
            subdata: {
              multiplier: 2,
            },
          },
        },
        {
          id: 'id02',
          data: { result: { value: 0 } },
        },
        {
          id: 'id03',
          data: { result: { value: 0 } },
        },
      ],
    );

    expect(tree[0].compute.mock.calls.length).toBe(1);
    expect(tree[0].compute.mock.calls[0][1]).toHaveLength(2);
    expect(tree[0].compute.mock.results[0].value).toBe(24);

    expect(tree[1].compute.mock.calls.length).toBe(1);
    expect(tree[1].compute.mock.calls[0][1]).toHaveLength(1);
    expect(tree[1].compute.mock.results[0].value).toBe(4);

    expect(computed).toBeDefined();
    expect(computed).toHaveLength(3);
    expect(computed[0]).toEqual({
      id: 'id01',
      data: { value: 3, subdata: { multiplier: 2 } },
    });
    expect(computed[1]).toEqual({
      id: 'id02',
      data: {
        result: {
          value: 24,
        },
      },
    });
    expect(computed[2]).toEqual({
      id: 'id03',
      data: {
        result: {
          value: 4,
        },
      },
    });
  });

  test('compute simple and deep field dependencies', () => {
    const tree = [
      {
        prop: 'el1.data.value',
        dependsOn: ['el2.data.value'],
        compute: jest.fn((_, [el2]) => el2.data.value + 1),
      },
      {
        prop: 'el4.str',
        dependsOn: ['el3.data'],
        compute: jest.fn((_, [el3]) => `Result: ${el3.data.result}`),
      },
      {
        prop: 'el1.data.multiplier',
        dependsOn: ['el2.data.multiplier'],
        compute: jest.fn((_, [el2]) => el2.data.multiplier + 1),
      },
      {
        prop: 'el3.data.result',
        dependsOn: ['el1.data'],
        compute: jest.fn((_, [el1]) => el1.data.value * el1.data.multiplier),
      },
    ];

    const computed = computeAll(
      {
        getId,
        tree,
      },
      [
        {
          id: 'el1',
          data: {
            value: -1, // 3 + 1 = 4
            multiplier: 0, // 2 + 1 = 3
          },
        },
        {
          id: 'el2',
          data: {
            value: 3,
            multiplier: 2,
          },
        },
        {
          id: 'el3',
          data: {
            result: 0, // 12
          },
        },
        {
          id: 'el4',
          str: '',
        },
      ],
    );
    expect(computed[0].data).toEqual({ value: 4, multiplier: 3 });
    expect(computed[2].data).toEqual({ result: 12 });
    expect(computed[3].str).toBe('Result: 12');

    expect(tree[0].compute.mock.calls.length).toBe(1);
    expect(tree[1].compute.mock.calls.length).toBe(1);
    expect(tree[2].compute.mock.calls.length).toBe(1);
    expect(tree[3].compute.mock.calls.length).toBe(1);

    expect(tree[3].compute.mock.results[0].value).toBe(12);
    expect(tree[1].compute.mock.results[0].value).toBe('Result: 12');
  });

  test('compute complex dependencies', () => {
    const arr = getComplexDependencies();
    const tree = makeDependencyTree(arr);
    const computed = computeAll({ getId, tree }, arr);
    expect(computed).toEqual([
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
  });
});
