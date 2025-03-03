import type { IDepositPlan } from "../plans/IDepositPlan";

export class DepositPlanRepository {
  private depositPlans: IDepositPlan[] = [];

  add(plan: IDepositPlan) {
    this.depositPlans.push(plan);
  }

  getByCustomerId(customerId: string): IDepositPlan[] {
    return this.depositPlans.filter((p) => p.customerId === customerId);
  }
}
