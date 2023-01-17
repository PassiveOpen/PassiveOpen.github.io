import { DatePipe } from "@angular/common";
import {
  Component,
  ElementRef,
  QueryList,
  ViewChildren,
  Input,
  AfterViewInit,
  OnInit,
} from "@angular/core";
import {
  column,
  GroupRow,
  PlanningStep,
  PlanningTable,
  Prop,
  TotalRow,
} from "src/app/house/planning.model";
import { round } from "src/app/shared/global-functions";

@Component({
  selector: "app-table-planning",
  templateUrl: "./table-planning.component.html",
  styleUrls: ["./table-planning.component.scss"],
})
export class AppTablePlanningComponent implements AfterViewInit, OnInit {
  dataSource;
  planning: PlanningTable;
  Prop = Prop;

  @Input() columns: column[];
  @Input() set data(planning: PlanningTable) {
    this.planning = planning;
    const steps = planning.steps.filter((x) => x);
    this.dataSource = [
      ...steps.flatMap((x: PlanningStep | GroupRow) => {
        if (x instanceof GroupRow) return [x, ...x.steps];

        return x;
      }),
      new TotalRow({
        name: `Total ${planning.alias.toLocaleLowerCase()}`,
        steps: steps,
      }),
    ];
  }

  @ViewChildren("tableRows", { read: ElementRef })
  rowContainers: QueryList<ElementRef<HTMLTableRowElement>>;

  groupRow = {};
  columnNames: string[];

  parts = [];

  constructor() {}
  ngOnInit(): void {
    this.columnNames = this.columns.map((x) => x.id);
  }
  ngAfterViewInit(): void {}

  readableNumbers(x: number, decimals?): string {
    if (decimals !== undefined) {
      return `€${round(x, 0).toLocaleString()}`;
    }
    if (x > 1000) {
      return `€${round(x).toLocaleString()}`;
    }
    return `€${x}`;
  }

  rowClick(row: PlanningStep | GroupRow) {
    if (row instanceof GroupRow) {
      row.toggleFold();
      this.rowContainers.forEach((rowEl) => {
        const classes = rowEl.nativeElement.classList;
        if (classes.contains(`group-${row.uuid}`)) {
          classes.toggle(`row-folded`);
        }
      });
    }
  }
}
