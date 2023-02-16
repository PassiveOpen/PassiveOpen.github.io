import { Component, AfterViewInit, ElementRef, OnDestroy } from "@angular/core";
import * as d3 from "d3";
import { AppService } from "src/app/app.service";
import { BasicSVG } from "src/app/svg/base-svg.component";
import { Graphic, Section } from "src/app/components/enum.data";
import { TooltipService } from "src/app/components/tooltip/tooltip.service";
import { HouseService } from "src/app/house/house.service";
import { D3DistanceService } from "../d3Distance.service";
import {
  Elevation,
  RoofPoint,
  RoofStyle,
  RoofType,
} from "src/app/house/cross.model";
import { ContextMenuService } from "src/app/components/context-menu/context-menu.service";
import { D3Service, SvgLoader } from "../d3.service";

@Component({
  selector: "app-svg-cross",
  templateUrl: "./svg-cross.component.html",
  styleUrls: ["./svg-cross.component.scss"],
})
export class SvgCrossComponent
  extends BasicSVG
  implements AfterViewInit, OnDestroy
{
  marginInMeters = [3, 3, 3, 3];
  figure: SvgLoader;
  graphic = Graphic.cross;
  RoofStyle = RoofStyle;

  constructor(
    public houseService: HouseService,
    public appService: AppService,
    public tooltipService: TooltipService,
    public host: ElementRef,
    public d3Service: D3Service,
    public d3DistanceService: D3DistanceService,
    public contextMenuService: ContextMenuService
  ) {
    super(
      houseService,
      appService,
      tooltipService,
      host,
      d3Service,
      d3DistanceService,
      contextMenuService
    );
  }

  ngAfterViewInit(): void {
    this.loadFigure();
    this.setUp();
    // setTimeout(() => {
    //   this.d3Service.startDistance();
    // }, 1000);
  }

  loadFigure() {
    this.figure = this.d3Service.loadSVG(
      "assets/models/dude.svg",
      ".g-figure",
      (selector) => {
        const h = 1.9;
        const scale = h / 568;
        let elev, offset, flip;
        const w = 117 * scale;

        if ([Section.roofBasics].includes(this.section)) {
          elev = this.house$.value.cross.elevations[Elevation.groundFloor];
          offset = this.house$.value.cross.topFloorThickness * 3;
          flip = true;
        } else {
          elev = this.house$.value.cross.elevations[Elevation.topFloor];
          offset = this.house$.value.cross.innerWidth / 2 - w / 2 + 0.5;
          flip = false;
        }
        d3.select(selector)
          .selectChild("svg")
          .attr("height", 568 * scale + "px") //width="117.184px" height="568.086px"
          .attr("y", -elev - h + "px")
          .attr("x", offset + "px")
          .attr("width", w + "px")
          .selectChild("g")
          .attr("transform", flip ? `translate(117,0) scale(-1 1)` : "");
      }
    );
  }

  svgUpdateMarginAndSize() {

    const low = this.cross.elevations[Elevation.crawlerFloor];
    this.drawingSize = [
      [0, -this.cross.elevations[RoofPoint.topOutside]],
      [
        this.house.outerBase,
        -low + this.cross.elevations[RoofPoint.topOutside],
      ],
    ];
    // const [[x, y], [maxX, maxY]] = this.drawingSize;
    const margin = 3;
    this.marginInMeters = [margin, margin, margin, margin];

    this.drawBendPoint();
    this.drawPoints(); //// Only for debug
    this.figure.update();
  }

  drawPoints() {
    this.house.cross.pointOf70Roof().forEach((point, i) => {
      d3.select<SVGCircleElement, unknown>(`#debug-point-${i}`)
        .attr("cx", point[0])
        .attr("cy", -point[1])
        .attr("r", 0.051)
        .style("fill", "var(--primary-color)")
        .attr("stroke-width", 0);
    });

    //   Object.keys(RoofPoint).forEach((key: RoofPoint, i) => {
    //     const point = this.house.construction.getRoofPoint(key);

    //     d3.select<SVGCircleElement, unknown>(`#debug-point-${i}`)
    //       .attr("cx", point[0] + this.cross.wallOuterThickness)
    //       .attr("cy", point[1])
    //       .attr("r", 0.1)
    //       .style("fill", "var(--primary-color)")
    //       .attr("stroke-width", 0);
    //   });
  }

  drawBendPoint() {
    const pointDiameter = 0.1;
    const level = this.cross.elevations[Elevation.topFloor];
    d3.select<SVGPolylineElement, unknown>("#bend-point__h-line")
      .attr(
        "points",
        [
          [0, -level - this.cross.roof70Walls],
          [this.cross.bendPoint[0], -level - this.cross.roof70Walls],
          [
            this.cross.bendPoint[0],
            -level + this.cross.bendPoint[1] + pointDiameter,
          ],
        ].join(" ")
      )
      .attr("stroke-width", this.meterPerPixel * 2);
    d3.select<SVGCircleElement, unknown>("#bend-point__h-point")
      .attr("cx", this.cross.bendPoint[0])
      .attr("cy", -level + this.cross.bendPoint[1])
      .attr("r", pointDiameter)
      .attr("stroke-width", this.meterPerPixel * 2);
  }

  roofCheck(roofStyle: RoofStyle) {
    const cross = this.house$.value.cross;
    const current = cross.roofStyle;
    if (this.section === Section.roof70) {
      return roofStyle === RoofStyle.roof70 ? 1 : 0;
    } else if (this.section === Section.roofCircle) {
      return roofStyle === RoofStyle.roofCircle ? 1 : 0;
    } else {
      return [RoofStyle.roofCircleAnd70, roofStyle].includes(current) ? 1 : 0;
    }
  }
}
