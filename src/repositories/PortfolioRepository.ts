import type { Portfolio } from "../entities/Portfolio";

export class PortfolioRepository {
  private portfolios: Portfolio[] = [];

  add(portfolio: Portfolio) {
    this.portfolios.push(portfolio);
  }

  getByCustomerId(customerId: string): Portfolio[] {
    return this.portfolios.filter((p) => p.customerId === customerId);
  }
}
