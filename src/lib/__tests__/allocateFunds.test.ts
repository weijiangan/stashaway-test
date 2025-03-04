// Use inline snapshot so I don't need to copy the strings manually
// I know I should use error codes instead...

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
        type: "type1",
        customerId: "customer1",
        isFilled: jest.fn().mockReturnValue(false),
        applyDeposit: jest.fn(),
      } as unknown as IDepositPlan,
      {
        id: "plan2",
        type: "type2",
        customerId: "customer1",
        isFilled: jest.fn().mockReturnValue(false),
        applyDeposit: jest.fn(),
      } as unknown as IDepositPlan,
    ];
  }

  test("should return error if no deposits are provided", () => {
    const result = allocateFunds(getMockPlans(), []);

    expect(result.success).toBe(false);
    expect(result.error).toMatchInlineSnapshot(`"No deposits provided for allocation."`);
  });

  test("should return error if no customer plans are found", () => {
    const deposits = [{ amount: new BigNumber(100), reference: "REF123" }];

    const result = allocateFunds([], deposits);

    expect(result.success).toBe(false);
    expect(result.error).toMatchInlineSnapshot(`"No deposit plans found for customer. Nothing is allocated"`);
  });

  test("should return error if no valid reference code is found", () => {
    const deposits = [{ amount: new BigNumber(100), reference: "INVALID" }];

    (mockCustomerRepo.getByReferenceCode as any).mockReturnValue(null);

    const result = allocateFunds(getMockPlans(), deposits);

    expect(result.success).toBe(false);
    expect(result.error).toMatchInlineSnapshot(
      `"No valid reference code found in deposits. Nothing will be allocated"`
    );
  });

  test("should return error if more than 2 plans are passed", () => {
    const mockPlans = getMockPlans();
    mockPlans[2] = { ...mockPlans[1], applyDeposit: jest.fn() };
    const deposits = [
      { amount: new BigNumber(100), reference: "REF123" },
      { amount: new BigNumber(200), reference: "REF123" },
    ];

    (mockCustomerRepo.getByReferenceCode as any).mockReturnValue({
      id: "customer1",
    });
    (mockPlans[0].applyDeposit as any).mockReturnValue({
      updatedAlloc: new Map([["plan1", new BigNumber(150)]]),
      remaining: new BigNumber(150),
    });
    (mockPlans[1].applyDeposit as any).mockReturnValue({
      updatedAlloc: new Map([["plan1", new BigNumber(150)]]),
      remaining: new BigNumber(150),
    });
    (mockPlans[2].applyDeposit as any).mockReturnValue({
      updatedAlloc: new Map([["plan1", new BigNumber(150)]]),
      remaining: new BigNumber(150),
    });

    const result = allocateFunds(mockPlans, deposits);

    expect(result.success).toBe(false);
    expect(result.error).toMatchInlineSnapshot(`"Maximum 2 deposit plans are accepted"`);
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
    expect(result.error).toMatchInlineSnapshot(`"Please ensure all deposits have the same reference code."`);
  });

  test("should return error if deposit plans do not match customer id", () => {
    const deposits = [{ amount: new BigNumber(100), reference: "REF123" }];

    (mockCustomerRepo.getByReferenceCode as any).mockReturnValue({
      id: "customer2",
    });

    const result = allocateFunds(getMockPlans(), deposits);

    expect(result.success).toBe(false);
    expect(result.error).toMatchInlineSnapshot(`"Deposit plans do not match the customer's reference code."`);
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
    expect(result.allocations).toEqual(
      new Map([
        ["plan1", new BigNumber(150)],
        ["plan2", new BigNumber(150)],
      ])
    );
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
    expect(result.allocations).toEqual(new Map([["plan2", new BigNumber(300)]]));
  });
});
