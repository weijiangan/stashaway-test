import { OneTimePlan } from "../OneTimePlan";
import BigNumber from "bignumber.js";

describe("OneTimePlan", () => {
  it("should return correct allocation size", () => {
    const plan = new OneTimePlan("customer", {
      account1: new BigNumber(150),
      account2: new BigNumber(250),
      account3: new BigNumber(100),
    });

    expect(plan.allocationSize).toEqual(new BigNumber(500));
  });

  it("should correctly identify unfilled plan", () => {
    const plan = new OneTimePlan("customer", {
      account1: new BigNumber(100),
      account2: new BigNumber(200),
    });

    expect(plan.isFilled()).toBe(false);
  });

  it("should apply deposit fully when deposit exceeds target and return remainder to be distributed - whole numbers", () => {
    const plan = new OneTimePlan("customer", {
      account1: new BigNumber(100),
      account2: new BigNumber(200),
    });

    const currentAllocations = new Map<string, BigNumber>([
      ["account1", new BigNumber(25)],
      ["account2", new BigNumber(50)],
    ]);
    const deposit = new BigNumber(400);

    const result = plan.applyDeposit(deposit, currentAllocations);

    expect(result.updatedAlloc.get("account1")).toEqual(new BigNumber(125));
    expect(result.updatedAlloc.get("account2")).toEqual(new BigNumber(250));
    expect(result.remaining).toEqual(new BigNumber(100));
  });

  it("should apply deposit fully when deposit exceeds target and return remainder to be distributed - fractions", () => {
    const plan = new OneTimePlan("customer", {
      account1: new BigNumber(99.33),
      account2: new BigNumber(200.67),
    });

    const currentAllocations = new Map<string, BigNumber>();
    const deposit = new BigNumber(500);

    const result = plan.applyDeposit(deposit, currentAllocations);

    expect(result.updatedAlloc.get("account1")).toEqual(new BigNumber(99.33));
    expect(result.updatedAlloc.get("account2")).toEqual(new BigNumber(200.67));
    expect(result.remaining).toEqual(new BigNumber(200));
    expect(plan.isFilled()).toBe(true);
  });

  it("should apply deposit proportionally when deposit is less than target", () => {
    const plan = new OneTimePlan("customer", {
      account1: new BigNumber(100),
      account2: new BigNumber(300),
    });

    const currentAllocations = new Map<string, BigNumber>();
    const deposit = new BigNumber(200);

    const result = plan.applyDeposit(deposit, currentAllocations);

    expect(result.updatedAlloc.get("account1")).toEqual(new BigNumber(50));
    expect(result.updatedAlloc.get("account2")).toEqual(new BigNumber(150));
    expect(result.remaining).toEqual(new BigNumber(0));
    expect(plan.isFilled()).toBe(false);
  });

  it("should distribute the funds correctly if deposit is equal plan size", () => {
    const plan = new OneTimePlan("customer", {
      account1: new BigNumber(100),
      account2: new BigNumber(200),
    });

    const currentAllocations = new Map<string, BigNumber>([
      ["account1", new BigNumber(25)],
      ["account2", new BigNumber(50)],
    ]);
    const deposit = new BigNumber(300);

    const result = plan.applyDeposit(deposit, currentAllocations);

    expect(result.updatedAlloc.get("account1")).toEqual(new BigNumber(125));
    expect(result.updatedAlloc.get("account2")).toEqual(new BigNumber(250));
    expect(result.remaining).toEqual(new BigNumber(0));
    expect(plan.isFilled()).toBe(true);
  });
});
