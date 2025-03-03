import BigNumber from "bignumber.js";

// Fully distribute a deposit proportionally to the weights of each portfolio.
// Calculate the contribution for each portfolio based on the ratio except the
// last one and substract the sum of of the previous portfolios for the last
// one so that the deposit will be fully distributed.

export function distributeProportionally(
  deposit: BigNumber,
  weights: Map<string, BigNumber>
): Map<string, BigNumber> {
  const contributions = new Map<string, BigNumber>();

  // Weights size is small enough to use Array.from
  const entries = Array.from(weights.entries());

  const totalWeight = entries.reduce((sum, [, weight]) => sum.plus(weight), new BigNumber(0));

  // Save some computation
  if (totalWeight.eq(0)) {
    return contributions;
  }
  let sumContributions = new BigNumber(0);

  for (let i = 0; i < entries.length - 1; i += 1) {
    const [id, weight] = entries[i];

    // Get ratio of the portfolio weight to the total weight.
    // Weight/totalWeight is the ratio
    const contribution = deposit.multipliedBy(weight).dividedBy(totalWeight);

    contributions.set(id, contribution);
    sumContributions = sumContributions.plus(contribution);
  }
  const [lastId] = entries[entries.length - 1];
  contributions.set(lastId, deposit.minus(sumContributions));

  return contributions;
}
