import { HttpClient } from "@angular/common/http";
import { Component, AfterViewInit, ViewChild, ElementRef } from "@angular/core";
import * as d3 from "d3";
import { Selection } from "d3";
import { AppService } from "src/app/app.service";
import { HouseService } from "src/app/house/house.service";
import { BasicSVGComponent } from "../base-svg.component";
import { BehaviorSubject } from "rxjs";
import { Floor, Graphic, Section } from "src/app/components/enum.data";
import { TooltipService } from "src/app/components/tooltip/tooltip.service";
import { D3DistanceService } from "../d3Distance.service";
import { ContextMenuService } from "src/app/components/context-menu/context-menu.service";
import { D3Service } from "../d3.service";

@Component({
  selector: "app-svg-stair-plan",
  templateUrl: "./svg-stair-plan.component.html",
  styleUrls: ["./svg-stair-plan.component.scss"],
})
export class SvgStairPlanComponent extends BasicSVGComponent {
  graphic = Graphic.stairPlan;
  floor = Floor.all;
  marginInMeters = [0, 0, 0, 0];
  marginInPixels = [64, 64, 0, 0];
  figure;
  steps = new BehaviorSubject(25);

  updateHousePartSVGs() {}
  afterUpdate() {}
  getHousePartsSelectors() {}
  afterInit() {}
  setHousePartVisibility() {}

  setMarginAndSize() {
    this.svgHouseSize = [
      this.stair.stairOrigin,
      [this.stair.totalWidth, this.stair.totalHeight],
    ];

    this.marginInMeters = [
      this.stair.run * 2,
      this.stair.run * 2,
      this.stair.run * 2,
      this.stair.run * 2,
    ];
    if (
      [Section.stairStart, Section.stairBasic, Section.stairCheck].includes(
        this.section
      )
    ) {
      this.svg.style("opacity", 0);
      this.svg.style("pointer-events", "none");
    } else {
      this.svg.style("pointer-events", "");
      this.svg.style("opacity", 1);
    }
  }
}
