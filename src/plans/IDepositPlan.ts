import BigNumber from "bignumber.js";

export interface IDepositPlan {
  type: string;
  customerId: string;
  priority: number;
  allocations: Map<string, BigNumber>;

  applyDeposit(
    deposit: BigNumber,
    currentAllocations: Map<string, BigNumber>
  ): { updatedAlloc: Map<string, BigNumber>; remaining: BigNumber };

  isFilled(): boolean;
}
