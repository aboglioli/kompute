const { checkCircularDependencies } = require('../lib/kompute');

describe('Circular dependencies', () => {
  test('checkCircularDependencies in tree', () => {
    let circular = checkCircularDependencies([
      {
        prop: 'el1.value',
        dependsOn: ['el2.value'],
        compute: () => {},
      },
      {
        prop: 'el2.value',
        dependsOn: ['el1.value'],
        compute: () => {},
      },
    ]);
    expect(circular).toBe(true);

    circular = checkCircularDependencies([
      {
        prop: 'el1.value',
        dependsOn: ['el1.value'],
        compute: () => {},
      },
    ]);
    expect(circular).toBe(true);

    circular = checkCircularDependencies([
      {
        prop: 'el2.value',
        dependsOn: ['el1.value'],
        compute: () => {},
      },
      {
        prop: 'el3.value',
        dependsOn: ['el1.value'],
        compute: () => {},
      },
    ]);
    expect(circular).toBe(false);

    circular = checkCircularDependencies([
      {
        prop: 'el1.value',
        dependsOn: ['el2.value'],
        compute: () => {},
      },
      {
        prop: 'el2.value',
        dependsOn: ['el3.value'],
        compute: () => {},
      },
      {
        prop: 'el3.value',
        dependsOn: ['el1.value'],
        compute: () => {},
      },
    ]);
    expect(circular).toBe(true);

    circular = checkCircularDependencies([
      {
        prop: 'el1.data.value',
        dependsOn: ['el2.data.value'],
        compute: () => {},
      },
      {
        prop: 'el2.data.value',
        dependsOn: ['el1.data.value'],
        compute: () => {},
      },
    ]);
    expect(circular).toBe(true);

    circular = checkCircularDependencies([
      {
        prop: 'el1.data.value',
        dependsOn: ['el2.data.value', 'el2.data.multiplier'],
        compute: () => {},
      },
      {
        prop: 'el2.data.multiplier',
        dependsOn: ['el1.data.value'],
        compute: () => {},
      },
    ]);
    expect(circular).toBe(true);

    circular = checkCircularDependencies([
      {
        prop: 'el1.data.value',
        dependsOn: ['el2.data.value'],
        compute: () => {},
      },
      {
        prop: 'el1.data.multiplier',
        dependsOn: ['el2.data.multiplier'],
        compute: () => {},
      },
      {
        prop: 'el3.data.result',
        dependsOn: ['el1.data'],
        compute: () => {},
      },
    ]);
    expect(circular).toBe(false);

    circular = checkCircularDependencies([
      {
        prop: 'data1.value',
        dependsOn: ['data2.value'],
        compute: () => {},
      },
      {
        prop: 'data3.value',
        dependsOn: ['data2.value'],
        compute: () => {},
      },
      {
        prop: 'data2.value',
        dependsOn: ['data4.value', 'data3.value', 'data5.value'],
        compute: () => {},
      },
    ]);
    expect(circular).toBe(true);

    circular = checkCircularDependencies([
      {
        prop: '1.data.prop1',
        dependsOn: ['2.data.prop2'],
        compute: () => {},
      },
      {
        prop: '2.data.prop1',
        dependsOn: ['1.data.prop2'],
        compute: () => {},
      },
    ]);
    expect(circular).toBe(false);

    circular = checkCircularDependencies([
      {
        prop: '1.data.prop',
        dependsOn: ['2.data.prop'],
        compute: () => {},
      },
      {
        prop: '2.data.prop',
        dependsOn: ['1.data'],
        compute: () => {},
      },
    ]);
    expect(circular).toBe(true);

    circular = checkCircularDependencies([
      {
        prop: '1.data.prop',
        dependsOn: ['2.data.prop'],
        compute: () => {},
      },
      {
        prop: '2.data.prop',
        dependsOn: ['3.data.prop'],
        compute: () => {},
      },
    ]);
    expect(circular).toBe(false);

    circular = checkCircularDependencies([
      {
        prop: '1.value',
        dependsOn: ['2.value'],
        compute: () => {},
      },
      {
        prop: '2.value',
        dependsOn: ['4.value'],
        compute: () => {},
      },
      {
        prop: '3.value',
        dependsOn: ['4.value'],
        compute: () => {},
      },
    ]);
    expect(circular).toBe(false);

    circular = checkCircularDependencies([
      {
        prop: '1.value',
        dependsOn: ['2.value'],
        compute: () => {},
      },
      {
        prop: '2.value',
        dependsOn: ['4.value'],
        compute: () => {},
      },
      {
        prop: '3.value',
        dependsOn: ['2.value'],
        compute: () => {},
      },
      {
        prop: '4.value',
        dependsOn: ['3.value'],
        compute: () => {},
      },
    ]);
    expect(circular).toBe(true);

    circular = checkCircularDependencies([
      {
        prop: '1.value',
        dependsOn: ['2.value'],
        compute: () => {},
      },
      {
        prop: '2.value',
        dependsOn: ['3.value', '4.value'],
        compute: () => {},
      },
      {
        prop: '3.value',
        dependsOn: ['1.value'],
        compute: () => {},
      },
      {
        prop: '4.value',
        dependsOn: ['3.value'],
        compute: () => {},
      },
    ]);
    expect(circular).toBe(true);

    circular = checkCircularDependencies([
      {
        prop: '1.data.prop',
        dependsOn: ['2.data'],
        compute: () => {},
      },
      {
        prop: '2.data.prop',
        dependsOn: ['1.data.prop'],
        compute: () => {},
      },
    ]);
    expect(circular).toBe(true);

    /***
     * Array:
     * - 1
     *   - data -----------
     *     - prop <-----  |
     *     - value     |  |
     * - 2             |  |
     *   - data --------  |
     *     - prop <--------
     *     - value
     */
    circular = checkCircularDependencies([
      {
        prop: '1.data',
        dependsOn: ['2.data.prop'],
        compute: () => {},
      },
      {
        prop: '2.data',
        dependsOn: ['1.data.prop'],
        compute: () => {},
      },
    ]);
    expect(circular).toBe(true);

    /***
     * Array:
     * - 1
     *   - data -------------
     *     - subdata        |
     *        - prop <---   |
     *        - value   |   |
     * - 2              |   |
     *   - data ---------   |
     *     - subdata        |
     *       - prop <--------
     *       - value
     */
    circular = checkCircularDependencies([
      {
        prop: '1.data',
        dependsOn: ['2.data.subdata.prop'],
        compute: () => {},
      },
      {
        prop: '2.data',
        dependsOn: ['1.data.subdata.prop'],
        compute: () => {},
      },
    ]);
    expect(circular).toBe(true);

    /***
     * Array:
     * - 1
     *   - data
     *     - subdata
     *        - prop <-------
     *        - value ----  |
     * - 2               |  |
     *   - data          |  |
     *     - subdata     |  |
     *       - prop <-----  |
     *       - value --------
     */
    circular = checkCircularDependencies([
      {
        prop: '1.data.subdata.value',
        dependsOn: ['2.data.subdata.prop'],
        compute: () => {},
      },
      {
        prop: '2.data.subdata.value',
        dependsOn: ['1.data.subdata.prop'],
        compute: () => {},
      },
    ]);
    expect(circular).toBe(false);
  });
});
