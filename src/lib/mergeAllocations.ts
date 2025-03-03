import BigNumber from "bignumber.js";

// Useful helper for avoiding mutating allocations directly when passed around

export function mergeAllocations(...allocations: Map<string, BigNumber>[]) {
  const mergedAllocation = new Map<string, BigNumber>();
  for (const allocation of allocations) {
    for (const [portfolioId, amount] of allocation) {
      const porfolioAmount = mergedAllocation.get(portfolioId) || new BigNumber(0);
      mergedAllocation.set(portfolioId, porfolioAmount.plus(amount));
    }
  }
  return mergedAllocation;
}
