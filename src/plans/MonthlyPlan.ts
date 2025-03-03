import BigNumber from "bignumber.js";
import type { IDepositPlan } from "./IDepositPlan";
import { distributeProportionally } from "../lib/distributeProportionally";

export class MonthlyPlan implements IDepositPlan {
  public customerId: string;

  public allocations: Map<string, BigNumber>;

  constructor(customerId: string, allocations: Record<string, BigNumber>) {
    this.customerId = customerId;
    this.allocations = new Map(Object.entries(allocations));
  }

  isFilled(): boolean {
    return false;
  }

  applyDeposit(
    deposit: BigNumber,
    currentAllocations: Map<string, BigNumber>
  ): { updatedAlloc: Map<string, BigNumber>; remaining: BigNumber } {
    const weights = new Map<string, BigNumber>(this.allocations);
    const contributions = distributeProportionally(deposit, weights);

    for (const [portfolioId, contribution] of contributions.entries()) {
      const portfolioAllocation = currentAllocations.get(portfolioId) || new BigNumber(0);
      currentAllocations.set(portfolioId, portfolioAllocation.plus(contribution));
    }

    return { updatedAlloc: currentAllocations, remaining: new BigNumber(0) };
  }
}
