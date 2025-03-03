// I intentionally import each modules separately instead of reexporting them with index.ts
// https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-7/

import BigNumber from "bignumber.js";
import { injectCustomerRepo } from "./lib/allocateFunds";
import { CustomerRepository } from "./repositories/CustomerRepository";
import { PortfolioRepository } from "./repositories/PortfolioRepository";
import { DepositPlanRepository } from "./repositories/DepositPlanRepository";
import { Customer } from "./entities/Customer";
import { Portfolio } from "./entities/Portfolio";
import { OneTimePlan } from "./plans/OneTimePlan";
import { MonthlyPlan } from "./plans/MonthlyPlan";

const customerRepo = new CustomerRepository();
const portfolioRepo = new PortfolioRepository();
const depositPlanRepo = new DepositPlanRepository();

const custWeiJian = new Customer("Wei Jian");
customerRepo.add(custWeiJian);

const highRisk = new Portfolio(custWeiJian.id, "High Risk");
const retirement = new Portfolio(custWeiJian.id, "Retirement");
portfolioRepo.add(highRisk);
portfolioRepo.add(retirement);

depositPlanRepo.add(
  new OneTimePlan(custWeiJian.id, {
    [highRisk.id]: new BigNumber(10000),
    [retirement.id]: new BigNumber(500),
  })
);
depositPlanRepo.add(
  new MonthlyPlan(custWeiJian.id, {
    [highRisk.id]: new BigNumber(0),
    [retirement.id]: new BigNumber(100),
  })
);

const deposits = [
  { amount: new BigNumber(10500), reference: custWeiJian.referenceCode },
  { amount: new BigNumber(100), reference: custWeiJian.referenceCode },
];

// Maybe this is cheating but I want to keep it as a function
const { allocateFunds } = injectCustomerRepo(customerRepo);

const result = allocateFunds(depositPlanRepo.getByCustomerId(custWeiJian.id), deposits);

if (result.success) {
  // Format output to use portfolio names instead of UUID
  const porfolioAllocationWithNames = Object.fromEntries(
    [...result.allocations.entries()].map(([portfolioId, amount]) => [
      portfolioRepo.getById(portfolioId)!.name,
      amount.toFixed(2),
    ])
  );
  console.log({ ...result, allocations: porfolioAllocationWithNames });
} else {
  console.log(result);
}
