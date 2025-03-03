import BigNumber from "bignumber.js";
import type { IDepositPlan } from "../plans/IDepositPlan";
import type { CustomerRepository } from "../repositories/CustomerRepository";

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_HALF_UP });

interface Deposit {
  amount: BigNumber;
  reference: string;
}

export const injectCustomerRepo = (customerRepo: CustomerRepository) => ({
  allocateFunds: function allocateFunds(
    customerPlans: IDepositPlan[],
    deposits: Deposit[]
  ): {
    success: boolean;
    allocations?: Record<string, string>;
    error?: string;
  } {
    if (deposits.length === 0) {
      return {
        success: false,
        error: "No deposits provided for allocation.",
      };
    }

    if (customerPlans.length === 0) {
      return {
        success: false,
        error: "No deposit plans found for customer.",
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

    for (const plan of customerPlans) {
      if (!plan.isFilled()) {
        const result = plan.applyDeposit(remainingDeposits, currentAlloc);
        currentAlloc = result.updatedAlloc;
        remainingDeposits = result.remaining;
      }
    }

    const allocations = Object.fromEntries(
      [...currentAlloc.entries()].map(([id, amt]) => [id, amt.decimalPlaces(2).toFixed(2)])
    );

    return {
      success: true,
      allocations,
    };
  },
});
