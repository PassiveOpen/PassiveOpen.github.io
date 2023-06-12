import { HttpClient } from "@angular/common/http";
import { Component, AfterViewInit, ViewChild, ElementRef } from "@angular/core";
import * as d3 from "d3";
import { Selection } from "d3";
import { AppService } from "src/app/app.service";
import { Cross, RoofType } from "src/app/house/cross.model";
import { House } from "src/app/house/house.model";
import { HouseService } from "src/app/house/house.service";
import { BehaviorSubject } from "rxjs";
import { Measure } from "src/app/house-parts/measure.model";
import { BasicSVGComponent } from "src/app/2d-svg/base-svg.component";
import { Floor, Graphic, Section } from "src/app/components/enum.data";
import { TooltipService } from "src/app/components/tooltip/tooltip.service";
import { D3DistanceService } from "../d3Distance.service";
import { ContextMenuService } from "src/app/components/context-menu/context-menu.service";
import { D3Service } from "../d3.service";

@Component({
  selector: "app-svg-stair-steps",
  templateUrl: "./svg-stair-steps.component.html",
  styleUrls: ["./svg-stair-steps.component.scss"],
})
export class SvgStairsComponent
  extends BasicSVGComponent
  implements AfterViewInit
{
  graphic = Graphic.stairCross;
  floor = Floor.all;
  // marginInPixel = [0, 0.5, 0, 1];
  // marginInMeters = [0, 0.5, 0, 1];
  figure;
  steps = new BehaviorSubject(1);

  updateHousePartSVGs() {}
  afterUpdate() {}
  getHousePartsSelectors() {}
  afterInit() {}
  setHousePartVisibility() {}

  setMarginAndSize() {
    const maxRun = this.stair.totalRise / Math.tan(30 * (Math.PI / 180));

    if ([Section.stairCheck, Section.stairPlan].includes(this.section)) {
      this.svgHouseSize = [
        [this.stair.run * 5, -this.stair.rise * 9],
        [this.stair.run * 4, this.stair.rise * 4],
      ];
    } else {
      this.svgHouseSize = [
        [-this.stair.run, -this.stair.totalRise],
        [maxRun, this.stair.totalRise + this.stair.floorThickness],
      ];
      this.marginInPixels = [40, 40, 80, 40];
    }

    this.marginInMeters = [0, this.stair.run * 2, 0, 0];

    if ([Section.stairPlan].includes(this.section)) {
      this.svg.style("opacity", 0);
      this.svg.style("pointer-events", "none");
    } else {
      this.svg.style("pointer-events", "");
      this.svg.style("opacity", 1);
    }
  }
}
