import { v4 as uuidv4 } from "uuid";

export class Portfolio {
  public id: string;
  constructor(public customerId: string, public name: string) {
    this.id = uuidv4();
  }
}
