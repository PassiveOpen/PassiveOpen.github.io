import { sum } from "d3";
import { round } from "../shared/global-functions";

export enum Prop {
  amount = "amount",
  name = "name",
  sizeOrVersion = "sizeOrVersion",
  price = "price",
  priceAvg = "priceAvg",
  priceMax = "priceMax",
  priceTotal = "priceTotal",
  remarks = "other",
  unit = "unit",
}
export type column = {
  id: keyof Cost | keyof GroupRow;
  name: string;
  postfix?: string;
  prefix?: string;
};

export class CostTable {
  name: string;
  alias: string;
  desc?: string;
  costs: (Cost | GroupRow)[];
}

export class Cost {
  constructor(partial: Partial<Cost>) {
    Object.assign(this, partial);
  }
  amount = 1;
  name: string;
  sizeOrVersion: string;
  price: number;
  priceAvg: number;
  priceMax: number;
  unit: string;
  other: string;
  uuid?: string;
  type = "single";

  get calcPrice() {
    return round(this.amount * this.price, -3);
  }
  get calcAmount() {
    return this.amount;
  }
}
export class GroupRow extends Cost {
  costs: Cost[] = [];
  name: string;
  uuid: string;
  type = "group";
  collapsed = false;
  get folded() {
    return `<span class="material-icons">expand_${
      !this.collapsed ? "more" : "less"
    }</span>`;
  }
  toggleFold() {
    this.collapsed = !this.collapsed;
  }

  constructor(partial: Partial<GroupRow>) {
    super(partial);
    Object.assign(this, partial);
  }
  get calcPrice() {
    return sum(this.costs.map((x) => x.calcPrice));
  }
  get calcAmount() {
    return sum(this.costs.map((x) => x.amount));
  }
}

export class TotalRow extends GroupRow {
  costs: (Cost | GroupRow)[] = [];
  type = "total";

  constructor(partial: Partial<GroupRow>) {
    super(partial);
    Object.assign(this, partial);
  }
  get calcPrice() {
    return sum(this.costs.map((x) => x.calcPrice));
  }
  get calcAmount() {
    return 0;
  }

  get folded() {
    return `<span class="material-icons">remove</span>`;
  }
}
