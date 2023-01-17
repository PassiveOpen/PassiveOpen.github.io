import { sum } from "d3";
import { Section } from "../components/enum.data";
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
  id: keyof Cost | keyof GroupRow | keyof TotalRow;
  name: string;
  def?: (x: string, y?: any) => string;
  postfix?: string;
  prefix?: string;
};
export class CostTable {
  alias: string;
  desc?: string;
  section: Section;
  sectionFold = false;
  costs: (Cost | GroupRow)[];

  constructor(partial: Partial<CostTable>) {
    Object.assign(this, partial);
  }
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
    return round(this.amount * this.price, 2);
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
