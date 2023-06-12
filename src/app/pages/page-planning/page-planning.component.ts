import { DatePipe } from "@angular/common";
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
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
  isSunday,
  sub,
} from "date-fns";
import {
  PlanningStep,
  PlanningTable,
  column,
  Prop,
  GroupRow,
  TotalRow,
  getWeekString,
} from "src/app/house/planning.model";
import { DomSanitizer } from "@angular/platform-browser";
import { Subscription, fromEvent } from "rxjs";
import { generateUUID } from "three/src/math/MathUtils";

@Component({
  selector: "app-page-planning",
  templateUrl: "./page-planning.component.html",
  styleUrls: ["./page-planning.component.scss"],
  providers: [DatePipe],
})
export class PagePlanningComponent implements OnInit, AfterViewInit {
  tables: PlanningTable[];
  steps: GroupRow[];
  columns: column[] = [
    {
      id: "folded",
      name: " ",
      def: (x) => this.sanitizer.bypassSecurityTrustHtml(x),
    },
    { id: Prop.name, name: "Name", def: (x) => `${x}` },
    { id: Prop.what, name: "What", def: (x) => `${x}` },
    // {
    //   id: Prop.firstDate,
    //   name: "First",
    //   def: (x, y) => `${this.datePipe.transform(x, "-----====dd-LL-YYYY")} `,
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

  startDate: Date = new Date(2023, 6 - 1, 15);
  subscriptions: Subscription[] = [];

  constructor(private sanitizer: DomSanitizer) {}

  ngAfterViewInit(): void {}
  ngOnInit(): void {
    const mainGroups = [
      this.getPreps(),
      this.getFoundationAndGround(),
      this.getFrameAndWeather(),
      this.getInstallations(),
      this.getInterior(),
      this.getOutside(),
      this.getOther(),
    ];

    let previousDate = this.startDate;

    const explodeDates = (steps: (PlanningStep | GroupRow)[]) => {
      steps.forEach((step) => {
        if (step.type === "group" && step instanceof GroupRow) {
          explodeDates(step.steps);
          step.setDays();
        } else {
          step.setDays(previousDate);
          previousDate = step.lastDate;
        }
      });
    };

    mainGroups.forEach((groupRow, i) => {
      groupRow.mainGroup = true;
      explodeDates(groupRow.steps);
      groupRow.setDays();
      mainGroups[i].steps.push(
        new TotalRow({
          name: `SUB Total ${groupRow.name}`,
          steps: groupRow.steps.filter((x) => x.type !== "total"),
          lastDate: groupRow.lastDate,
          firstDate: groupRow.firstDate,
        })
      );
    });
    this.minFirstDate = new Date(
      Math.min(...mainGroups.map((x) => x.firstDate.getTime()))
    );
    this.maxLastDate = new Date(
      Math.max(...mainGroups.map((x) => x.lastDate.getTime()))
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
        id: getWeekString(d),
        name: ` ${getWeek(d)} ${
          [1, 52, 53].includes(getWeek(d))
            ? "'" + getYear(d).toString().substring(2)
            : ""
        } `,
        def: (dates) => {
          return this.sanitizer.bypassSecurityTrustHtml(
            `<div class="week-block">
              ${dates
                .map((date) => {
                  const start = getDay(date) - 1;
                  return `<div class="week-block-fill ${
                    isSunday(date) ? "sunday-block-fill" : ""
                  }" style="
                left: ${Math.round((start / 7) * 100)}%;
              "></div>`;
                })
                .join("")}
              <span>${dates.filter((x) => !isSunday(x)).length}</span>
            </div>`
          );
        },
      }))
    );

    mainGroups.push(
      new TotalRow({
        name: `House totals `,
        steps: mainGroups,
        uuid: generateUUID(),
      })
    );

    const parseStep = (step: PlanningStep, parentUUIDs: string[]) => {
      step.parentUUIDs = parentUUIDs;
      return step;
    };
    const explode = (
      steps: (PlanningStep | GroupRow)[],
      parentUUIDs: string[]
    ) => {
      return steps.flatMap((step) => {
        const s = parseStep(step, parentUUIDs);
        if (step.type === "total") return [s];
        if (step instanceof GroupRow) {
          return [s, ...explode(step.steps, [...parentUUIDs, step.uuid])];
        } else {
          return [s];
        }
      });
    };

    this.steps = explode(mainGroups, ["main"]);
    this.steps.filter((x) => x.type === "total").forEach((x) => x.setDays());
    console.log("full table", this.steps);
  }

  // DATA

  getPreps() {
    return new GroupRow({
      name: "Preparations",
      steps: [
        new PlanningStep({ name: "Geologic research", days: 1 }),
        new PlanningStep({ name: "Redesign", days: 10 }),
        new PlanningStep({
          name: "Bygglov",
          days: 10,
          isExpanded: true,
          more: `
          <a href="planning_in_depth">more in depth</a>
<ul>
  <li>side / floor plans</li>
  <li>details</li>
  <li><a>https://www.horby.se/bygga-bo-och-miljo/bygga-nytt-andra-eller-riva/bygglov/</a></li>
</ul>`,
        }),
      ],
    });
  }

  getFoundationAndGround() {
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
    return new GroupRow({
      name: "Foundation & ground work",
      steps: [
        new GroupRow({
          name: `${dirt[0].name}`,
          steps: dirt,
        }),
        new GroupRow({
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

  getFrameAndWeather() {
    return new GroupRow({
      name: "Framing & Weather seal",
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

  getInterior() {
    return new GroupRow({
      name: "Interior",
      steps: [
        new PlanningStep({ name: "Kitchen", days: 2 }),
        new PlanningStep({ name: "Kitchen Countertop", days: 5 }),
        new PlanningStep({ name: "Floors", days: 4 }),
        new PlanningStep({ name: "Bathroom tiling", days: 4 }),
      ],
    });
  }

  getInstallations() {
    return new GroupRow({
      name: "Installations",
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
    return new GroupRow({
      name: "Outside",
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

  getOther() {
    return new GroupRow({
      name: "Other",
      steps: [
        new PlanningStep({ name: "Inspections", days: 1 }),
        new PlanningStep({ name: "Share", days: 1 }),
      ],
    });
  }
}
