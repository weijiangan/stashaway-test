import BigNumber from "bignumber.js";
import type { IDepositPlan } from "./IDepositPlan";
import { distributeProportionally } from "../lib/distributeProportionally";
import { mergeAllocations } from "../lib/mergeAllocations";

export class MonthlyPlan implements IDepositPlan {
  public type = "MONTHLY" as const;

  public customerId: string;

  public priority = 500;

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
    const contributions = distributeProportionally(deposit, this.allocations);
    const finalAllocation = mergeAllocations(currentAllocations, contributions);

    return { updatedAlloc: finalAllocation, remaining: new BigNumber(0) };
  }
}
