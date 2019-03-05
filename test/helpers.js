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

module.exports = {
  calculateCost,
};
