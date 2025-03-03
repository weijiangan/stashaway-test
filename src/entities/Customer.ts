import { v4 as uuidv4 } from "uuid";

export class Customer {
  public id: string;
  public referenceCode: string;
  constructor(public name: string) {
    this.id = uuidv4();
    this.referenceCode = uuidv4(); // Unique reference for deposits
  }
}
