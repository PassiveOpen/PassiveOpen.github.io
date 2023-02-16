import { DatePipe } from "@angular/common";
import { AfterViewInit, Component, HostListener, OnInit } from "@angular/core";
import { AppService } from "src/app/app.service";
import { Section } from "src/app/components/enum.data";
import { HouseService } from "src/app/house/house.service";
import {
  add,
  differenceInCalendarWeeks,
  differenceInDays,
  eachWeekOfInterval,
  formatISO,
  getDay,
  getWeek,
  getYear,
  sub,
} from "date-fns";
import {
  PlanningStep,
  PlanningTable,
  column,
  Prop,
  GroupRow,
} from "src/app/house/planning.model";
import { DomSanitizer } from "@angular/platform-browser";
import { generateUUID } from "three/src/math/MathUtils";

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
    // {
    //   id: Prop.firstDate,
    //   name: "First",
    //   def: (x, y) => `${this.datePipe.transform(x, "dd-LL-YYYY")} `,
    // },
    // { id: Prop.more, name: "Remarks", def: (x) => `${x}` },
    { id: Prop.days, name: "Days", def: (x) => ` ${x} ` },
    // {
    //   id: Prop.lastDate,
    //   name: "Last",
    //   def: (x, y) => `${this.datePipe.transform(x, "dd-LL-YYYY")} `,
    // },
  ];

  minFirstDate: Date;
  maxLastDate: Date;
  totalWeeks: number;
  totalDays: number;
  weeks: Date[];

  starDate: Date = new Date(2024, 2, 1);

  constructor(
    private datePipe: DatePipe,
    private houseService: HouseService,
    private appService: AppService,
    private sanitizer: DomSanitizer
  ) {
    console.log();
  }
  ngOnInit(): void {
    this.tables = this.calc([
      this.getPreps(),
      this.getFoundation(),
      this.getFraming(),
      this.getFinishing(),
      this.getInstallations(),
      this.getOutside(),
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

    this.weeks = eachWeekOfInterval({
      start: this.minFirstDate,
      end: this.maxLastDate,
    });

    this.columns.push(
      ...this.weeks.map((d) => ({
        id: `week-${formatISO(d, { representation: "date" })}`,
        name: ` ${getWeek(d)} ${
          [1, 52, 53].includes(getWeek(d))
            ? "'" + getYear(d).toString().substring(2)
            : ""
        } `,
        def: (x, y) =>
          this.sanitizer.bypassSecurityTrustHtml(
            `<div class="week-block">
              <div class="week-block-fill" style="
                width:${Math.round(Math.abs((x / 7) * 100))}%;
                left: ${Math.round(Math.abs((y / 7) * 100))}%;
              "></div>
              <span>${Math.abs(x)}</span>
            </div>`
          ),
      }))
    );

    this.tables.forEach((table) => {
      table.steps.forEach((step) => {
        try {
          eachWeekOfInterval({
            start: step.firstDate,
            end: step.lastDate,
          }).forEach((week, i, j) => {
            const l = j.length;
            const isoWeek = formatISO(week, { representation: "date" });
            let a = 0;

            if (l === 1) {
              // only one week
              a = step.days;
              step[`week-${isoWeek}-extra`] = getDay(step.firstDate);
            } else if (i === 0) {
              a = 7 - getDay(step.firstDate); // sundays...
              step[`week-${isoWeek}-extra`] = getDay(step.firstDate);
            } else if (i === l - 1) {
              a = getDay(step.lastDate) + 1;
              step[`week-${isoWeek}-extra`] = 0;
            } else {
              a = 7;
              step[`week-${isoWeek}-extra`] = 0;
            }
            // else if (week === lastWeek) {
            //   a = step.lastDate.getDay();
            // }extra
            step[`week-${isoWeek}`] = a;
            // console.log(i, l, step);
          });
        } catch (e) {
          console.error(step);
        }
      });
    });
    console.log(this.tables);
    console.log(
      this.tables[1].steps[0].uuid,
      (this.tables[1].steps[0] as GroupRow).steps[0].uuid
    );
  }

  calc(tables: PlanningTable[]) {
    const hasDeadline = (step: PlanningStep) => !!step.deadline;
    tables.forEach((table, ii) => {
      if (ii === 0) {
        table.firstDate = this.starDate;
      } else {
        table.firstDate = add(tables[ii - 1].lastDate, { days: 1 });
      }

      table.steps.forEach((step, i) => {
        const previous = table.steps[i - 1];
        if (!previous) {
          step.firstDate = table.firstDate;
        } else {
          step.firstDate = add(previous.lastDate, { days: 1 });
        }
        step.lastDate = add(step.firstDate, {
          days: Math.max(1, step.days - 1),
        });
      });

      table.lastDate = table.steps[table.steps.length - 1].lastDate;
    });
    return tables;
  }

  // DATA

  getPreps() {
    return new PlanningTable({
      section: Section.planningPreps,
      alias: "Preparations",
      steps: [
        new PlanningStep({ name: "Paper work", days: 3, more: "BigTODO" }),
        new PlanningStep({
          name: "Redesign",
          days: 2,
          // @ts-ignore
          deadline: new Date("2024", "04", "21"),
        }),
      ],
    });
  }

  getFoundation() {
    const dirt = [
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
    ];
    const footings = [
      new PlanningStep({ name: "Footings", what: "Snapping lines", days: 1 }),
      new PlanningStep({ name: "Footings", what: "IFC blocks", days: 2 }),
      new PlanningStep({ name: "Footings", what: "Drainage", days: 2 }),
      new PlanningStep({
        name: "Footings",
        what: "Pouring Concrete",
        days: 7,
      }),
    ];
    return new PlanningTable({
      section: Section.planningFoundation,
      alias: "Foundation",
      steps: [
        new GroupRow({
          uuid: generateUUID(),
          name: `${dirt[0].name}`,
          steps: dirt,
        }),
        new GroupRow({
          uuid: `${generateUUID()}`,
          name: `${footings[0].name}`,
          steps: footings,
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
  getFraming() {
    return new PlanningTable({
      section: Section.planningFraming,
      alias: "Framing",
      steps: [
        new PlanningStep({ name: "Ground Floor	Measure for Square", days: 1 }),
        new PlanningStep({ name: "Ground Floor	Snapping the lines", days: 1 }),
        new PlanningStep({ name: "Walls	Frame the outside", days: 10 }),
        new PlanningStep({ name: "Walls	Frame walls", days: 5 }),
        new PlanningStep({ name: "Stairs	Build temp stairs", days: 2 }),
        new PlanningStep({ name: "Top Floor	Mounting Rim LVL", days: 2 }),
        new PlanningStep({ name: "Top Floor	Rolling Joists", days: 4 }),
        new PlanningStep({ name: "Top Floor	Sheeting", days: 3 }),
        new PlanningStep({ name: "Roof	Rolling rafters", days: 4 }),
        new PlanningStep({ name: "Roof	Chimenys and cutouts", days: 4 }),
        new PlanningStep({ name: "Roof	Lower Sheeting", days: 2 }),
        new PlanningStep({ name: "Roof	insulation", days: 2 }),
        new PlanningStep({ name: "Roof	Outer sheet", days: 2 }),
        new PlanningStep({ name: "Roof	Tiles", days: 5 }),
        new PlanningStep({ name: "Windows	Normal openings", days: 5 }),
        new PlanningStep({ name: "Windows	Doors", days: 3 }),
        new PlanningStep({ name: "Windows	Glass facade", days: 3 }),
        new PlanningStep({ name: "Windows	Taping", days: 1 }),
        new PlanningStep({
          name: "Pirsing pipes (installationroom + chimneys)",
          days: 2,
        }),
        new PlanningStep({ name: "DoorBlowertest", days: 1 }),
        new PlanningStep({ name: "Deadline	Corrections", days: 3 }),
      ],
    });
  }

  getFinishing() {
    return new PlanningTable({
      section: Section.planningFinishing,
      alias: "Finishing",
      steps: [
        new PlanningStep({ name: "Kitchen", days: 2 }),
        new PlanningStep({ name: "Kitchen Countertop", days: 5 }),
        new PlanningStep({ name: "Floors", days: 4 }),
        new PlanningStep({ name: "Bathroom tiling", days: 4 }),
      ],
    });
  }

  getInstallations() {
    return new PlanningTable({
      section: Section.planningInstallations,
      alias: "Installations",
      steps: [
        new PlanningStep({ name: "Water	Plumming / Sewer", days: 3 }),
        new PlanningStep({ name: "Water	Warm Cold water", days: 3 }),
        new PlanningStep({ name: "Water	Rainwater  + installation", days: 3 }),
        new PlanningStep({ name: "Water	Installation + Tank", days: 3 }),
        new PlanningStep({ name: "Floor heating	Tubeing", days: 3 }),
        new PlanningStep({
          name: "Floor heating	Concrete pressure layer",
          days: 3,
        }),
        new PlanningStep({
          name: "Floor heating	Mechanic installation",
          days: 3,
        }),
        new PlanningStep({
          name: "Electrics	Building Power Connection",
          days: 5,
        }),
        new PlanningStep({ name: "Electrics	Tubes + Wiring", days: 1 }),
        new PlanningStep({ name: "Electrics	Installation", days: 2 }),
        new PlanningStep({ name: "Electrics	Fixes/ lamps", days: 4 }),
        new PlanningStep({ name: "Electrics	3Phases", days: 1 }),
        new PlanningStep({ name: "Electrics	Eternet Cables", days: 2 }),
        new PlanningStep({ name: "Electrics	Alarm", days: 2 }),
        new PlanningStep({ name: "HVAC	Pipes", days: 3 }),
        new PlanningStep({ name: "HVAC	Mechanic installation", days: 2 }),
      ],
    });
  }

  getOutside() {
    return new PlanningTable({
      section: Section.planningOutside,
      alias: "Outerside",
      steps: [
        new PlanningStep({ name: "Walls	Prep El/Cables etc", days: 2 }),
        new PlanningStep({ name: "Walls	Corners", days: 2 }),
        new PlanningStep({ name: "Walls	Trimming windows/ Doors", days: 5 }),
        new PlanningStep({ name: "Walls	Window blinds", days: 2 }),
        new PlanningStep({ name: "Walls	Farstu preps", days: 2 }),
        new PlanningStep({ name: "Walls	Insulation", days: 4 }),
        new PlanningStep({ name: "Walls	Outer planks", days: 8 }),
      ],
    });
  }
}
