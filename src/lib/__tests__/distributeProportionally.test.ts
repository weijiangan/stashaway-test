import { distributeProportionally } from "../distributeProportionally";
import BigNumber from "bignumber.js";

describe("distributeProportionally", () => {
  test("should distribute proportionally according to weights", () => {
    const deposit = new BigNumber(100);
    const weights = new Map<string, BigNumber>([
      ["portfolio1", new BigNumber(2)],
      ["portfolio2", new BigNumber(3)],
      ["portfolio3", new BigNumber(5)],
    ]);

    const result = distributeProportionally(deposit, weights);

    expect(result.get("portfolio1")?.toNumber()).toBe(20);
    expect(result.get("portfolio2")?.toNumber()).toBe(30);
    expect(result.get("portfolio3")?.toNumber()).toBe(50);
  });

  test("should handle zero weights and return empty map", () => {
    const deposit = new BigNumber(100);
    const weights = new Map<string, BigNumber>([
      ["portfolio1", new BigNumber(0)],
      ["portfolio2", new BigNumber(0)],
    ]);

    const result = distributeProportionally(deposit, weights);

    expect(result.size).toBe(0);
  });

  test("should handle single portfolio", () => {
    const deposit = new BigNumber(100);
    const weights = new Map<string, BigNumber>([["portfolio1", new BigNumber(5)]]);

    const result = distributeProportionally(deposit, weights);

    expect(result.get("portfolio1")?.toNumber()).toBe(100);
  });

  test("should handle rounding errors by allocating remainder to last portfolio", () => {
    const deposit = new BigNumber(100);
    const weights = new Map<string, BigNumber>([
      ["portfolio1", new BigNumber(1)],
      ["portfolio2", new BigNumber(3)],
      ["portfolio3", new BigNumber(3)],
    ]);

    const result = distributeProportionally(deposit, weights);

    // Expected distribution: 14.285..., 42.857..., 42.857...
    // Due to rounding, last portfolio should get the remainder
    const portfolio1Contribution = result.get("portfolio1");
    const portfolio2Contribution = result.get("portfolio2");
    const portfolio3Contribution = result.get("portfolio3");

    // Check that the sum equals the deposit
    const sum = portfolio1Contribution!.plus(portfolio2Contribution!).plus(portfolio3Contribution!);
    expect(sum.isEqualTo(deposit)).toBe(true);

    // Check that the first two portfolios have the expected distribution
    expect(portfolio1Contribution!.toNumber()).toBeCloseTo(100 * (1 / 7), 5);
    expect(portfolio2Contribution!.toNumber()).toBeCloseTo(100 * (3 / 7), 5);
    expect(portfolio3Contribution!.toNumber()).toBeCloseTo(100 * (3 / 7), 5);
  });
});
