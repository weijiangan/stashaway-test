import { injectCustomerRepo } from "../allocateFunds";
import BigNumber from "bignumber.js";
import type { IDepositPlan } from "../../plans/IDepositPlan";
import type { CustomerRepository } from "../../repositories/CustomerRepository";

describe("allocateFunds", () => {
  let mockCustomerRepo: CustomerRepository;
  let allocateFunds: ReturnType<typeof injectCustomerRepo>["allocateFunds"];

  beforeEach(() => {
    mockCustomerRepo = {
      getByReferenceCode: jest.fn(),
    } as unknown as CustomerRepository;

    allocateFunds = injectCustomerRepo(mockCustomerRepo).allocateFunds;
  });

  function getMockPlans() {
    return [
      {
        id: "plan1",
        customerId: "customer1",
        isFilled: jest.fn().mockReturnValue(false),
        applyDeposit: jest.fn(),
      } as unknown as IDepositPlan,
      {
        id: "plan2",
        customerId: "customer1",
        isFilled: jest.fn().mockReturnValue(false),
        applyDeposit: jest.fn(),
      } as unknown as IDepositPlan,
    ];
  }

  test("should return error if no deposits are provided", () => {
    const result = allocateFunds(getMockPlans(), []);

    expect(result.success).toBe(false);
    expect(result.error).toBe("No deposits provided for allocation.");
  });

  test("should return error if no customer plans are found", () => {
    const deposits = [{ amount: new BigNumber(100), reference: "REF123" }];

    const result = allocateFunds([], deposits);

    expect(result.success).toBe(false);
    expect(result.error).toBe("No deposit plans found for customer.");
  });

  test("should return error if no valid reference code is found", () => {
    const deposits = [{ amount: new BigNumber(100), reference: "INVALID" }];

    (mockCustomerRepo.getByReferenceCode as any).mockReturnValue(null);

    const result = allocateFunds(getMockPlans(), deposits);

    expect(result.success).toBe(false);
    expect(result.error).toBe("No valid reference code found in deposits. Nothing will be allocated");
  });

  test("should return error if deposits have different reference codes", () => {
    const deposits = [
      { amount: new BigNumber(100), reference: "REF123" },
      { amount: new BigNumber(200), reference: "REF456" },
    ];

    (mockCustomerRepo.getByReferenceCode as any).mockReturnValue({
      id: "customer1",
    });

    const result = allocateFunds(getMockPlans(), deposits);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Please ensure all deposits have the same reference code.");
  });

  test("should return error if deposit plans do not match customer id", () => {
    const deposits = [{ amount: new BigNumber(100), reference: "REF123" }];

    (mockCustomerRepo.getByReferenceCode as any).mockReturnValue({
      id: "customer2",
    });

    const result = allocateFunds(getMockPlans(), deposits);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Deposit plans do not match the customer's reference code.");
  });

  test("should allocate funds successfully across plans", () => {
    const mockPlans = getMockPlans();
    const deposits = [
      { amount: new BigNumber(100), reference: "REF123" },
      { amount: new BigNumber(200), reference: "REF123" },
    ];

    (mockCustomerRepo.getByReferenceCode as any).mockReturnValue({
      id: "customer1",
    });

    const initialMap = new Map<string, BigNumber>();

    (mockPlans[0].applyDeposit as any).mockReturnValue({
      updatedAlloc: new Map([["plan1", new BigNumber(150)]]),
      remaining: new BigNumber(150),
    });

    (mockPlans[1].applyDeposit as any).mockReturnValue({
      updatedAlloc: new Map([
        ["plan1", new BigNumber(150)],
        ["plan2", new BigNumber(150)],
      ]),
      remaining: new BigNumber(0),
    });

    const result = allocateFunds(mockPlans, deposits);

    expect(result.success).toBe(true);
    expect(result.allocations).toEqual({
      plan1: "150.00",
      plan2: "150.00",
    });
  });

  test("should skip already filled plans", () => {
    const mockPlans = getMockPlans();
    const deposits = [{ amount: new BigNumber(300), reference: "REF123" }];

    (mockCustomerRepo.getByReferenceCode as any).mockReturnValue({
      id: "customer1",
    });

    (mockPlans[0].isFilled as any).mockReturnValue(true);
    (mockPlans[1].applyDeposit as any).mockReturnValue({
      updatedAlloc: new Map([["plan2", new BigNumber(300)]]),
      remaining: new BigNumber(0),
    });

    const result = allocateFunds(mockPlans, deposits);

    expect(result.success).toBe(true);
    expect(mockPlans[0].applyDeposit).not.toHaveBeenCalled();
    expect(mockPlans[1].applyDeposit).toHaveBeenCalled();
    expect(result.allocations).toEqual({
      plan2: "300.00",
    });
  });
});
