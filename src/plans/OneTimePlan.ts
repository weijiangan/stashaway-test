import BigNumber from "bignumber.js";
import type { IDepositPlan } from "./IDepositPlan";
import { distributeProportionally } from "../lib/distributeProportionally";
import { mergeAllocations } from "../lib/mergeAllocations";

export class OneTimePlan implements IDepositPlan {
  public type = "ONETIME" as const;

  public customerId: string;

  public priority = 100;

  public allocations: Map<string, BigNumber>;

  // Track previously allocated funds in case deposit not enough to cover target
  private appliedAlloc: Map<string, BigNumber> = new Map();

  constructor(customerId: string, allocations: Record<string, BigNumber>) {
    this.customerId = customerId;
    this.allocations = new Map(Object.entries(allocations));
  }

  get allocationSize(): BigNumber {
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
    // Don't allocate anything
    if (this.isFilled()) {
      return { updatedAlloc: currentAllocations, remaining: deposit };
    }

    const previouslyAllocatedSum = [...this.allocations.entries()].reduce(
      (sum, [id]) => sum.plus(this.appliedAlloc.get(id) || new BigNumber(0)),
      new BigNumber(0)
    );

    const remainingTarget = this.allocationSize.minus(previouslyAllocatedSum);

    // If deposit can cover the target, fill the difference to avoid rounding errors
    if (deposit.gte(remainingTarget)) {
      for (const [id, targetAmount] of this.allocations) {
        currentAllocations.set(
          id,
          (currentAllocations.get(id) || BigNumber(0)).plus(
            targetAmount.minus(this.appliedAlloc.get(id) || BigNumber(0))
          )
        );
      }
      this.appliedAlloc = new Map(this.allocations);
      return { updatedAlloc: currentAllocations, remaining: deposit.minus(remainingTarget) };
    }

    // If not enough to cover, distribute proportionally
    const incompleteAllocation = distributeProportionally(deposit, this.allocations);
    const updatedAlloc = mergeAllocations(currentAllocations, incompleteAllocation);
    this.appliedAlloc = mergeAllocations(this.appliedAlloc, incompleteAllocation);

    return {
      updatedAlloc,
      remaining: BigNumber(0),
    };
  }
}
