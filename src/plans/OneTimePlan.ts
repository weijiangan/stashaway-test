import BigNumber from "bignumber.js";
import type { IDepositPlan } from "./IDepositPlan";
import { distributeProportionally } from "../lib/distributeProportionally";

export class OneTimePlan implements IDepositPlan {
  public customerId: string;

  public allocations: Map<string, BigNumber>;

  private appliedAlloc: Map<string, BigNumber> = new Map();

  constructor(customerId: string, allocations: Record<string, BigNumber>) {
    this.customerId = customerId;
    this.allocations = new Map(Object.entries(allocations));
  }

  get allocationTarget(): BigNumber {
    return [...this.allocations.values()].reduce((acc, amt) => acc.plus(amt), new BigNumber(0));
  }

  isFilled(): boolean {
    return [...this.allocations.entries()].every(([id, target]) =>
      (this.appliedAlloc.get(id) || new BigNumber(0)).gte(target)
    );
  }

  applyDeposit(
    deposit: BigNumber,
    currentAllocations: Map<string, BigNumber>
  ): { updatedAlloc: Map<string, BigNumber>; remaining: BigNumber } {
    const updatedAllocPlan = new Map(this.appliedAlloc);

    const previouslyAllocated = [...this.allocations.entries()].reduce(
      (sum, [id]) => sum.plus(updatedAllocPlan.get(id) || new BigNumber(0)),
      new BigNumber(0)
    );

    const remainingTarget = this.allocationTarget.minus(previouslyAllocated);
    if (remainingTarget.lte(0)) {
      return { updatedAlloc: currentAllocations, remaining: deposit };
    }

    // Deposit might not be enough to cover remaining target
    const depositUsed = BigNumber.minimum(deposit, remainingTarget);

    // Calculate weights as remaining amounts per portfolio.
    const weights = new Map<string, BigNumber>();
    for (const [portfolioId, target] of this.allocations.entries()) {
      const allocated = updatedAllocPlan.get(portfolioId) || new BigNumber(0);
      weights.set(portfolioId, target.minus(allocated));
    }
    const contributions = distributeProportionally(depositUsed, weights);

    //
    for (const [portfolioId, contribution] of contributions.entries()) {
      const planAlloc = updatedAllocPlan.get(portfolioId) || new BigNumber(0);
      updatedAllocPlan.set(portfolioId, planAlloc.plus(contribution));
      const portfolioAllocation = currentAllocations.get(portfolioId) || new BigNumber(0);
      currentAllocations.set(portfolioId, portfolioAllocation.plus(contribution));
    }
    this.appliedAlloc = updatedAllocPlan;

    return {
      updatedAlloc: currentAllocations,
      remaining: deposit.minus(depositUsed),
    };
  }
}
