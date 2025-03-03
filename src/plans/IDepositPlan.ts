import BigNumber from "bignumber.js";

export interface IDepositPlan {
  customerId: string;

  allocations: Map<string, BigNumber>;

  applyDeposit(
    deposit: BigNumber,
    currentAllocations: Map<string, BigNumber>
  ): { updatedAlloc: Map<string, BigNumber>; remaining: BigNumber };

  isFilled(): boolean;
}
