import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal, DomPortal } from "@angular/cdk/portal";
import { DatePipe } from "@angular/common";
import {
  Component,
  ElementRef,
  QueryList,
  ViewChildren,
  Input,
  AfterViewInit,
  OnInit,
  ViewChild,
} from "@angular/core";
import { MatTable } from "@angular/material/table";
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
  overlayRef: OverlayRef;

  @Input() columns: column[];
  @Input() scrollContainer: any;
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
  tableContainers: QueryList<ElementRef<HTMLTableRowElement>>;

  @ViewChild("tableHeader", { read: ElementRef })
  tableHeader: ElementRef<HTMLTableRowElement>;

  @ViewChildren(".table-row", { read: ElementRef })
  tableFirstCol: QueryList<ElementRef<HTMLTableCellElement>>;
  @ViewChild("table", { read: ElementRef })
  table: ElementRef<HTMLTableElement>;

  groupRow = {};
  columnNames: string[];

  parts = [];

  highlightedColumn = 0;

  constructor(private overlay: Overlay) {}
  ngOnInit(): void {
    this.columnNames = this.columns.map((x) => x.id);
  }
  ngAfterViewInit(): void {
    // this.observer();
    // this.double();
  }

  observer() {
    console.log(this);
    // .nativeElement.getElementsByClassName('foo')[0]

    const threshold = 0.2; // how much % of the element is in view
    const observer = new window.IntersectionObserver(
      (entries) => {
        console.log(1, entries);
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // run your animation code here
            observer.disconnect(); // disconnect if you want to stop observing else it will rerun every time its back in view. Just make sure you disconnect in ngOnDestroy instead
          }
        });
      },
      { threshold }
    );
    console.log(this.tableHeader.nativeElement);

    observer.observe(this.tableHeader.nativeElement);
  }

  mouseenter(e: MouseEvent) {
    // const el = e.target as HTMLElement;
    // this.highlightedColumn = Array.from(el.parentNode.children).indexOf(el);
    // document
    //   .querySelectorAll(`td:nth-child(${this.highlightedColumn})`)
    //   .forEach((x) => {
    //     x.classList.add("highlighted");
    //   });
  }
  mouseleave(e: MouseEvent) {
    // document.querySelectorAll("td.highlighted").forEach((x) => {
    //   x.classList.remove("highlighted");
    // });
  }
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
    console.log(row);

    if (row instanceof GroupRow) {
      row.toggleFold();
      this.tableContainers.forEach((rowEl) => {
        const classes = rowEl.nativeElement.classList;

        console.log(
          classes,
          classes.contains(`group-${row.uuid}`),
          `group-${row.uuid}`
        );
        if (classes.contains(`group-${row.uuid}`)) {
          classes.toggle(`row-folded`);
        }
      });
    }
  }

  //===============

  double() {
    this.overlayRef = this.overlay.create({
      positionStrategy: this.positionStrategy(),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
    const contextPortal = new DomPortal(this.tableHeader);
    this.overlayRef.addPanelClass("example-overlay");
    const menuRef = this.overlayRef.attach(contextPortal);
  }
  positionStrategy() {
    return (
      this.overlay
        .position()
        .flexibleConnectedTo(this.tableContainers.first)
        .withPositions([
          {
            originX: "start",
            originY: "top",
            overlayX: "start",
            overlayY: "top",
          },
        ])
        // .withScrollableContainers([this.scrollContainer])
        .withFlexibleDimensions(false)
        .withPush(false)
    );
  }
}
