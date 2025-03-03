import BigNumber from "bignumber.js";
import type { IDepositPlan } from "../plans/IDepositPlan";
import type { CustomerRepository } from "../repositories/CustomerRepository";
import { distributeProportionally } from "./distributeProportionally";
import { mergeAllocations } from "./mergeAllocations";

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_HALF_UP });

interface Deposit {
  amount: BigNumber;
  reference: string;
}

type AllocationResult =
  | {
      success: true;
      allocations: Map<string, BigNumber>;
      error?: never;
    }
  | {
      success: false;
      allocations?: never;
      // Normally I would use error codes, this is just to keep things simple
      error: string;
    };

export const injectCustomerRepo = (customerRepo: CustomerRepository) => ({
  allocateFunds: function allocateFunds(
    customerPlans: IDepositPlan[],
    deposits: Deposit[]
  ): AllocationResult {
    if (deposits.length === 0) {
      return {
        success: false,
        error: "No deposits provided for allocation.",
      };
    }

    if (customerPlans.length === 0) {
      return {
        success: false,
        error: "No deposit plans found for customer. Nothing is allocated",
      };
    }

    if (customerPlans.length > 2) {
      return {
        success: false,
        error: "Maximum 2 deposit plans are accepted",
      };
    }

    // Need to change if we start accepting more than 2 deposit plans. KISS for now
    if (customerPlans.length > 1 && customerPlans[0].type === customerPlans[1].type) {
      return {
        success: false,
        error: "Only 1 one-time and/or 1 monthly deposit plan can be accepted at a time",
      };
    }

    let referenceCode: string;
    let matchedCustomer;
    for (const deposit of deposits) {
      matchedCustomer = customerRepo.getByReferenceCode(deposit.reference);
      if (matchedCustomer) {
        referenceCode = deposit.reference;
        break;
      }
    }

    if (!matchedCustomer) {
      return {
        success: false,
        error: "No valid reference code found in deposits. Nothing will be allocated",
      };
    }

    const invalidDeposits = deposits.filter((d) => d.reference !== referenceCode);
    if (invalidDeposits.length > 0) {
      return {
        success: false,
        error: "Please ensure all deposits have the same reference code.",
      };
    }

    if (customerPlans.some((plan) => plan.customerId !== matchedCustomer.id)) {
      return {
        success: false,
        error: "Deposit plans do not match the customer's reference code.",
      };
    }

    const customerDeposits = [...deposits];

    // Sum total deposit amount to batch allocation operations, with db could reduce the number of writes
    let remainingDeposits = customerDeposits.reduce((acc, d) => acc.plus(d.amount), new BigNumber(0));
    let currentAlloc = new Map<string, BigNumber>();

    customerPlans
      // We must process the one-time plans first or else deposit will be distributed fully first leaving no
      // funds left for one-time plan
      .sort((a, b) => a.priority - b.priority)
      .forEach((plan) => {
        // If deposit is insufficient to cover one-time plan it can still be covered later
        if (remainingDeposits.gt(0) && !plan.isFilled()) {
          // pass a cloned allocation so it will not be mutated accidentally
          const result = plan.applyDeposit(remainingDeposits, new Map(currentAlloc));
          currentAlloc = result.updatedAlloc;
          remainingDeposits = result.remaining;
        }
      });

    // If there are no monthly deposit plans there could be leftovers. Distribute proportionally
    if (remainingDeposits.gt(0)) {
      currentAlloc = mergeAllocations(
        distributeProportionally(remainingDeposits, currentAlloc),
        currentAlloc
      );
    }

    return {
      success: true,
      allocations: currentAlloc,
    };
  },
});
