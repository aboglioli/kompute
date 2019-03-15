const { wrap } = require('../lib/kompute');
const getId = item => item.id;

describe('Wrap', () => {
  test('wrap and update item directly', () => {
    let calls = 0;
    const arr = [
      {
        id: 'id01',
        data: 23,
        multiplier: 2,
      },
      {
        id: 'id02',
        data: 0,
      },
    ];
    const wrapped = wrap(
      {
        getId,
        tree: [
          {
            prop: 'id02.data',
            dependsOn: ['id01.data'],
            compute: (_, [el1]) => {
              calls++;
              return el1.data * el1.multiplier;
            },
          },
        ],
      },
      arr,
    );
    expect(wrapped[1].data).toBe(0);

    wrapped[0].data = 15;
    expect(wrapped[1].data).toBe(30);

    // item 1 is not watching for changes on "multiplier"
    wrapped[0].multiplier = 3;
    expect(wrapped[1].data).toBe(30);

    wrapped[0].data = 20;
    expect(wrapped[1].data).toBe(60);

    expect(calls).toBe(2);
  });

  test('wrap deep dependencies and update item indirectly', () => {
    const tree = [
      {
        prop: 'id02.data.value',
        dependsOn: ['id01.data.value', 'id01.data.multiplier'],
        compute: jest.fn((_, [el1]) => el1.data.value * el1.data.multiplier),
      },
    ];

    const arr = [
      {
        id: 'id01',
        data: {
          value: 12,
          multiplier: 2,
        },
      },
      {
        id: 'id02',
        data: {
          value: 0,
        },
      },
    ];

    const wrapped = wrap(
      {
        getId,
        tree,
      },
      arr,
    );
    expect(wrapped[1].data).toEqual({ value: 0 });

    wrapped[0].data.value = 15;
    expect(wrapped[1].data).toEqual({ value: 30 });

    wrapped[0].data.multiplier = 3;
    expect(wrapped[1].data).toEqual({ value: 45 });

    wrapped[0].data = { value: 5, multiplier: 2 };
    expect(wrapped[1].data).toEqual({ value: 10 });

    expect(tree[0].compute.mock.calls.length).toBe(3);
    expect(tree[0].compute.mock.calls[0][1].length).toBe(1);
    expect(tree[0].compute.mock.calls[1][1].length).toBe(1);
    expect(tree[0].compute.mock.calls[2][1].length).toBe(1);
    expect(tree[0].compute.mock.results[0].value).toBe(30);
    expect(tree[0].compute.mock.results[1].value).toBe(45);
    expect(tree[0].compute.mock.results[2].value).toBe(10);
  });

  test('wrap deep dependencies and compute returns an object', () => {
    const tree = [
      {
        prop: 'id02.data',
        dependsOn: ['id01.data.value', 'id01.data.multiplier'],
        compute: jest.fn((_, [el1]) => ({
          value: el1.data.value * el1.data.multiplier,
        })),
      },
    ];

    const arr = [
      {
        id: 'id01',
        data: {
          value: 12,
          multiplier: 2,
        },
      },
      {
        id: 'id02',
        data: {
          value: 0,
        },
      },
    ];

    const wrapped = wrap(
      {
        getId,
        tree,
      },
      arr,
    );
    expect(wrapped[1].data).toEqual({ value: 0 });

    wrapped[0].data.value = 15;
    expect(wrapped[1].data).toEqual({ value: 30 });

    wrapped[0].data.multiplier = 3;
    expect(wrapped[1].data).toEqual({ value: 45 });

    wrapped[0].data = { value: 5, multiplier: 2 };
    expect(wrapped[1].data).toEqual({ value: 10 });

    expect(tree[0].compute.mock.calls.length).toBe(3);
    expect(tree[0].compute.mock.calls[0][1].length).toBe(1);
    expect(tree[0].compute.mock.calls[1][1].length).toBe(1);
    expect(tree[0].compute.mock.calls[2][1].length).toBe(1);
    expect(tree[0].compute.mock.results[0].value).toEqual({ value: 30 });
    expect(tree[0].compute.mock.results[1].value).toEqual({ value: 45 });
    expect(tree[0].compute.mock.results[2].value).toEqual({ value: 10 });
  });

  test('wrap deep dependencies using indirect tree', () => {
    const tree = [
      {
        prop: 'id02.data.value',
        dependsOn: ['id01.data'],
        compute: jest.fn((_, [el1]) => el1.data.value * el1.data.multiplier),
      },
    ];

    const arr = [
      {
        id: 'id01',
        data: {
          value: 12,
          multiplier: 2,
        },
      },
      {
        id: 'id02',
        data: {
          value: 0,
        },
      },
    ];

    const wrapped = wrap(
      {
        getId,
        tree,
      },
      arr,
    );
    expect(wrapped[1].data).toEqual({ value: 0 });

    wrapped[0].data.value = 15;
    expect(wrapped[1].data).toEqual({ value: 30 });

    wrapped[0].data.multiplier = 3;
    expect(wrapped[1].data).toEqual({ value: 45 });

    wrapped[0].data = { value: 5, multiplier: 2 };
    expect(wrapped[1].data).toEqual({ value: 10 });

    expect(tree[0].compute.mock.calls.length).toBe(3);
    expect(tree[0].compute.mock.calls[0][1].length).toBe(1);
    expect(tree[0].compute.mock.calls[1][1].length).toBe(1);
    expect(tree[0].compute.mock.calls[2][1].length).toBe(1);
    expect(tree[0].compute.mock.results[0].value).toEqual(30);
    expect(tree[0].compute.mock.results[1].value).toEqual(45);
    expect(tree[0].compute.mock.results[2].value).toEqual(10);
  });
});
