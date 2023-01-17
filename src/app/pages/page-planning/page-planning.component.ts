import { DatePipe } from "@angular/common";
import { AfterViewInit, Component, HostListener, OnInit } from "@angular/core";
import { AppService } from "src/app/app.service";
import { Section } from "src/app/components/enum.data";
import { HouseService } from "src/app/house/house.service";
import {
  add,
  differenceInCalendarWeeks,
  differenceInDays,
  getWeek,
  getYear,
  sub,
} from "date-fns";
import {
  PlanningStep,
  PlanningTable,
  column,
  Prop,
} from "src/app/house/planning.model";

const toWeekYear = (date: Date) => {
  return `${getWeek(date)}-${getYear(date)}`;
};
@Component({
  selector: "app-page-planning",
  templateUrl: "./page-planning.component.html",
  styleUrls: ["./page-planning.component.scss"],
  providers: [DatePipe],
})
export class PagePlanningComponent implements OnInit {
  tables: PlanningTable[];
  columns: column[] = [
    { id: "folded", name: "", def: (x) => `${x}` },
    { id: Prop.name, name: "Name", def: (x) => `${x}` },
    { id: Prop.what, name: "What", def: (x) => `${x}` },
    {
      id: Prop.firstDate,
      name: "First",
      def: (x, y) => `${this.datePipe.transform(x, "dd-LL-YYYY")} `,
    },
    { id: Prop.days, name: "Days", def: (x) => ` ${x} ` },
    {
      id: Prop.lastDate,
      name: "Last",
      def: (x, y) => `${this.datePipe.transform(x, "dd-LL-YYYY")} `,
    },
    { id: Prop.more, name: "Remarks", def: (x) => `${x}` },
  ];

  minFirstDate: Date;
  maxLastDate: Date;
  totalWeeks: number;
  totalDays: number;
  weeks: string[];

  constructor(
    private datePipe: DatePipe,
    private houseService: HouseService,
    private appService: AppService
  ) {
    console.log();
  }
  ngOnInit(): void {
    this.tables = this.calc([
      this.getPreps(),
      this.getFoundation(),
      // this.getFoundation()
    ]);

    this.minFirstDate = new Date(
      Math.min(
        ...this.tables.flatMap((x) => x.steps).map((x) => x.firstDate.getTime())
      )
    );
    this.maxLastDate = new Date(
      Math.max(
        ...this.tables.flatMap((x) => x.steps).map((x) => x.lastDate.getTime())
      )
    );

    this.totalDays = differenceInDays(this.maxLastDate, this.minFirstDate);
    this.totalWeeks = differenceInCalendarWeeks(
      this.maxLastDate,
      this.minFirstDate
    );

    this.weeks = Array(this.totalWeeks)
      .fill(null)
      .map((_, i) => toWeekYear(add(this.minFirstDate, { weeks: i })));

    this.columns.push(
      ...this.weeks.map((wy) => ({
        id: `week-${wy}`,
        name: ` ${wy} `,
        def: (x) => `${x}`,
      }))
    );

    this.tables.forEach((table) => {
      table.steps.forEach((step) => {
        const firstWeek = toWeekYear(step.firstDate);
        const lastWeek = toWeekYear(step.lastDate);
        const first = this.weeks.findIndex((x) => x === firstWeek);
        const last = this.weeks.findIndex((x) => x === lastWeek);
        step.weeks = this.weeks.slice(first, last + 1);
        step.weeks.forEach((week) => {
          let a = 0;
          if (week === firstWeek) {
            const d = step.firstDate.getDay();
            a = 7 - (step.firstDate.getDay() - 1);
          } else if (week === lastWeek) {
            a = step.lastDate.getDay();
          }
          step[`week-${week}`] = a;
        });
        console.log(step.firstDate.getDay(), step.lastDate.getDay(), step);
      });
    });
  }

  calc(tables: PlanningTable[]) {
    tables.forEach((table) => {
      for (var i = table.steps.length; i--; ) {
        const step = table.steps[i];
        const laterStep = table.steps[i + 1];
        if (!laterStep) {
          step.lastDate = step.deadline || new Date();
        } else {
          step.lastDate = sub(laterStep.firstDate, { days: 1 });
        }
        step.firstDate = sub(step.lastDate, { days: step.days - 1 });
      }
    });
    return tables;
  }

  getPreps() {
    return new PlanningTable({
      section: Section.planningPreps,
      alias: "Preparations",
      steps: [
        new PlanningStep({ name: "Paper work", days: 40, more: "BigTODO" }),
        new PlanningStep({
          name: "Redesign",
          days: 10,
          // @ts-ignore
          deadline: new Date("2024", "04", "21"),
        }),
      ],
    });
  }

  getFoundation() {
    return new PlanningTable({
      section: Section.planningFoundation,
      alias: "Foundation",
      steps: [
        new PlanningStep({ name: "Dirt work", what: "Ground preps", days: 2 }),
        new PlanningStep({
          name: "Dirt work",
          what: "Flatten surface / compacting",
          days: 9,
        }),
        new PlanningStep({
          name: "Dirt work",
          what: "Snapping lines",
          days: 11,
        }),
        new PlanningStep({ name: "Dirt work", what: "Digging hole", days: 2 }),
        new PlanningStep({ name: "Footings", what: "Snapping lines", days: 1 }),
        new PlanningStep({ name: "Footings", what: "IFC blocks", days: 2 }),
        new PlanningStep({ name: "Footings", what: "Drainage", days: 2 }),
        new PlanningStep({
          name: "Footings",
          what: "Pouring Concrete",
          days: 7,
        }),
        new PlanningStep({ name: "Walls", what: "Snapping lines", days: 2 }),
        new PlanningStep({ name: "Walls", what: "IFC blocks", days: 2 }),
        new PlanningStep({ name: "Walls", what: "Pouring Concrete", days: 7 }),
        new PlanningStep({ name: "First Floor", what: "Prep wall", days: 2 }),
        new PlanningStep({
          name: "First Floor",
          what: "Install prefab",
          days: 6,
        }),
        new PlanningStep({
          name: "Deadline",
          what: "Foundation finished",
          days: 8,
        }),
      ],
    });
  }
}
