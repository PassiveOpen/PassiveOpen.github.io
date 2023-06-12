import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { DataSource } from "@angular/cdk/collections";
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import {
  ComponentPortal,
  DomPortal,
  TemplatePortal,
} from "@angular/cdk/portal";
import {
  Component,
  ElementRef,
  QueryList,
  ViewChildren,
  Input,
  AfterViewInit,
  OnInit,
  ViewChild,
  ContentChildren,
  ViewContainerRef,
  TemplateRef,
} from "@angular/core";
import { Subscription, of } from "rxjs";
import {
  column,
  GroupRow,
  PlanningStep,
  PlanningTable,
  Prop,
} from "src/app/house/planning.model";
import { round } from "src/app/shared/global-functions";

@Component({
  selector: "app-table-planning",
  templateUrl: "./table-planning.component.html",
  styleUrls: ["./table-planning.component.scss"],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition("expanded <=> collapsed", animate("225ms")),
    ]),
  ],
})
export class AppTablePlanningComponent implements AfterViewInit, OnInit {
  @Input() dataSource: GroupRow[];
  @Input() columns: column[];
  @Input() scrollContainer: any;
  subscriptions: Subscription[] = [];
  expandedElement: any;
  @ViewChildren("tableRows", { read: ElementRef }) tableRows: QueryList<
    ElementRef<HTMLTableRowElement>
  >;
  @ViewChild("table", { read: ElementRef }) table: ElementRef<HTMLTableElement>;

  groupRow = {};
  columnNames: string[];

  parts = [];
  isOpen = false;

  constructor(private viewContainerRef: ViewContainerRef) {}

  ngOnInit(): void {
    this.columnNames = this.columns.map((x) => x.id);
  }
  ngAfterViewInit(): void {}

  rowClasses(row: PlanningStep | GroupRow) {
    return `table-row group-${row.uuid} 
    ${row.isExpanded ? "row-readmore" : ""} 
    ${row instanceof GroupRow && row.mainGroup ? "group-row-main" : ""} 
    ${row.parentUUIDs.map((x) => `parent-${x}`).join(" ")} row-${row.type}`;
  }

  rowClick(e: MouseEvent, row: PlanningStep | GroupRow) {
    if (row.type === "group" && row instanceof GroupRow) {
      row.toggleFold();

      this.tableRows.forEach((rowEl) => {
        const classes = rowEl.nativeElement.classList;

        if (classes.contains(`parent-${row.uuid}`)) {
          if (row.collapsed) {
            classes.add(`row-folded`);
          } else {
            classes.remove(`row-folded`);
          }
        }

        if (classes.contains(`group-${row.uuid}`)) {
          if (row.collapsed) {
            classes.add(`row-collapsed`);
          } else {
            classes.remove(`row-collapsed`);
          }
        }
      });
    } else {
      // document.querySelectorAll(".row-more-info").forEach((x) => {
      //   x.classList.add("row-more-info-hidden");
      //   setTimeout(() => {
      //     x.remove();
      //   }, 1000);
      // });

      if (row.more === undefined) {
        return;
      }
      if (row.isExpanded === true) {
        row.isExpanded = !row.isExpanded;
        return;
      }

      row.isExpanded = !row.isExpanded;
    }
  }
}
