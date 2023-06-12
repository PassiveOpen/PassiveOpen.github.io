import { SafeHtml } from "@angular/platform-browser";
import { now, sum } from "d3";
import { Section } from "../components/enum.data";
import { round } from "../shared/global-functions";
import { generateUUID } from "three/src/math/MathUtils";
import {
  add,
  eachDayOfInterval,
  format,
  formatISO,
  getDay,
  getISOWeek,
  getISOWeekYear,
  isMonday,
  isSaturday,
  isSunday,
  startOfWeek,
  sub,
} from "date-fns";
import { ElementRef } from "@angular/core";

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
  def?: (x: any, y?: any, z?: any) => string | SafeHtml;
  postfix?: string;
  prefix?: string;
};

export class PlanningTable {
  alias: string;
  desc?: string;
  section: Section;
  sectionFold = false;
  steps: GroupRow[];

  firstDate = new Date();
  lastDate = new Date();

  constructor(partial: Partial<PlanningTable>) {
    Object.assign(this, partial);
  }
}

export const getWeekString = (date: Date) => {
  const week = startOfWeek(date); // start on sunday...
  return `week-${formatISO(week, { representation: "date" })}`;
};

export class PlanningStep {
  name: string;
  days: number;
  what: string;
  more?: string;
  index?: number;
  type = "single";

  weeks: string[];
  [key: `week-${string}`]: Date[];
  firstDate = new Date();
  lastDate = new Date();
  dates: Date[];
  extra: any;

  template: any;

  uuid?: string;
  parentUUIDs?: string[] = [];

  removedSundays: Date[] = [];
  isExpanded = false;

  get folded() {
    if (this.isExpanded === undefined) return "";
    return `<span class="material-icons" style="margin-left:${
      this.type === "single" ? "8px" : ""
    };transform: rotate(${this.isExpanded ? 180 : 0}deg);">expand_more</span>`;
  }

  constructor(partial: Partial<PlanningStep>) {
    Object.assign(this, partial);
    this.uuid = `${generateUUID()}`;
  }

  setDays(previous: Date) {
    this.firstDate = add(previous, { days: 1 });
    const totalDays = Math.max(1, this.days - 1);
    this.dates = eachDayOfInterval({
      start: this.firstDate,
      end: add(this.firstDate, { days: totalDays }),
    });
    this.removeSundays();
    this.weeks = [...new Set(this.dates.map((x) => getWeekString(x)))];
    this.dates.forEach((date, i) => {
      const k = `${getWeekString(date)}`;
      if (!this[k]) {
        this[k] = [];
      }
      this[k].push(date);
    });

    this.removedSundays.forEach((date) => {
      const k = `${getWeekString(date)}`;
      if (!this[k]) {
        this[k] = [];
      }
      this[k].push(date);
    });

    this.lastDate = this.dates[this.dates.length - 1];
    this.firstDate = this.dates[0];
  }

  removeSundays() {
    let loop = true;
    let i = 0;
    while (loop) {
      const index = this.dates.findIndex((x) => isSunday(x));
      if (index > -1) {
        const deleted = this.dates.splice(index, 1)[0];
        this.removedSundays.push(deleted);
        const lastDate = this.dates[this.dates.length - 1];
        const addDate = add(lastDate, {
          days: isSaturday(lastDate) ? 2 : 1,
        });
        this.dates.push(addDate);
      } else {
        loop = false;
      }
      i++;
      if (i > 30) {
        console.error("loop error", this.dates, this.name);
        loop = false;
      }
    }
  }
}

export class GroupRow extends PlanningStep {
  steps: (PlanningStep | GroupRow)[] = [];
  name: string;
  uuid: string;
  type = "group";
  mainGroup = false;
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
  setDays() {
    const s = this.steps.filter((x) => x.type !== "total");
    this.firstDate = new Date(Math.min(...s.map((x) => x.firstDate.getTime())));
    this.lastDate = new Date(Math.max(...s.map((x) => x.lastDate.getTime())));
    this.dates = [...new Set(s.flatMap((x) => x.dates))];
    this.days = this.dates.length;

    this.weeks = [...new Set(this.dates.map((x) => getWeekString(x)))];
    s.forEach((step, i) => {
      Object.keys(step).forEach((k) => {
        if (k.startsWith("week-")) {
          if (!this[k]) {
            this[k] = [];
          }
          this[k].push(...step[k]);
        }
      });
    });

    this.lastDate = new Date(
      Math.max(...s.flatMap((x) => x.lastDate.getTime()))
    );
    this.firstDate = new Date(
      Math.min(...s.flatMap((x) => x.firstDate.getTime()))
    );
  }

  constructor(partial: Partial<GroupRow>) {
    super(partial);
    Object.assign(this, partial);

    if (this.type === "group") {
      this.steps.forEach((step) => {
        step.parentUUIDs.push(...[...this.parentUUIDs, this.uuid]);
      });
    }
  }
}

export class TotalRow extends GroupRow {
  steps: (PlanningStep | GroupRow)[] = [];
  type = "total";

  constructor(partial: Partial<TotalRow>) {
    super({
      partial,
      type: "total",
    } as any);
    Object.assign(this, partial);
  }

  get folded() {
    return `<span class="material-icons">remove</span>`;
  }
}
