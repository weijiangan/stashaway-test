import type { Portfolio } from "../entities/Portfolio";

export class PortfolioRepository {
  private portfolios: Portfolio[] = [];

  add(portfolio: Portfolio) {
    this.portfolios.push(portfolio);
  }

  getById(portfolioId: string) {
    return this.portfolios.find((porfolio) => porfolio.id === portfolioId);
  }

  getByCustomerId(customerId: string): Portfolio[] {
    return this.portfolios.filter((p) => p.customerId === customerId);
  }
}
