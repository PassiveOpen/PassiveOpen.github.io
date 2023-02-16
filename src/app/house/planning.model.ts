import { SafeHtml } from "@angular/platform-browser";
import { now, sum } from "d3";
import { generateUUID } from "three/src/math/MathUtils";
import { Section } from "../components/enum.data";
import { round } from "../shared/global-functions";

export enum Chapters {
  preparations = "preparations",
}

export enum Prop {
  name = "name",
  days = "days",
  what = "what",
  more = "more",
  deadline = "deadline",

  firstDate = "firstDate",
  lastDate = "lastDate",
}

export type column = {
  id: keyof PlanningStep | keyof GroupRow | keyof TotalRow | string;
  name: string;
  def?: (x: any, y?: any) => string | SafeHtml;
  postfix?: string;
  prefix?: string;
};

export class PlanningTable {
  alias: string;
  desc?: string;
  section: Section;
  sectionFold = false;
  steps: (PlanningStep | GroupRow)[];

  firstDate = new Date();
  lastDate = new Date();

  constructor(partial: Partial<PlanningTable>) {
    Object.assign(this, partial);
  }
}

export class PlanningStep {
  constructor(partial: Partial<PlanningStep>) {
    Object.assign(this, partial);
    if (this.deadline !== undefined) {
      this.lastDate = this.deadline;
    }
  }
  name: string;
  days: number;
  what: string;
  more?: string;
  deadline?: Date;
  index?: number;
  type = "single";

  weeks: string[];

  firstDate = new Date();
  lastDate = new Date();
  extra: any;

  uuid?: string;
}
export class GroupRow extends PlanningStep {
  steps: PlanningStep[] = [];
  name: string;
  uuid: string;
  type = "group";
  collapsed = false;
  firstDate = new Date();
  lastDate = new Date();
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

    this.uuid = partial.uuid;
    this.steps.forEach((step) => {
      step.uuid = partial.uuid;
    });

    this.lastDate = new Date(
      Math.max(...this.steps.flatMap((x) => x.lastDate.getTime()))
    );
    this.firstDate = new Date(
      Math.max(...this.steps.flatMap((x) => x.firstDate.getTime()))
    );

    this.days = sum(this.steps.flatMap((x) => x.days));
  }
}

export class TotalRow extends GroupRow {
  steps: (PlanningStep | GroupRow)[] = [];
  type = "total";

  constructor(partial: Partial<GroupRow>) {
    super(partial);
    Object.assign(this, partial);
  }

  get folded() {
    return `<span class="material-icons">remove</span>`;
  }
}
