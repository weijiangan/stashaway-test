import type { Customer } from "../entities/Customer";

export class CustomerRepository {
  private customers: Customer[] = [];

  add(customer: Customer) {
    this.customers.push(customer);
  }

  getByCustomerId(customerId: string): Customer | undefined {
    return this.customers.find((p) => p.id === customerId);
  }

  getByReferenceCode(referenceCode: string): Customer | undefined {
    return this.customers.find((p) => p.referenceCode === referenceCode);
  }
}
