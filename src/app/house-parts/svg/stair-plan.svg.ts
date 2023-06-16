import * as d3 from "d3";
import { Floor } from "src/app/components/enum.data";
import { xy } from "src/app/house/house.model";
import { Stair, Stringers } from "src/app/house/stairs.model";
import {
  angleBetween,
  angleXY,
  distanceBetweenPoints,
  lineIntersect,
  multiLineIntersect,
} from "src/app/shared/global-functions";
import { HousePartSVG } from "../model/housePart.model";
import { StairModel } from "../stair-plan.model";

export class StairPlanSVG extends HousePartSVG<StairModel> {
  fontSize = 10;
  svgText: d3.Selection<SVGTextElement, unknown, HTMLElement, any>;
  svgStep: d3.Selection<SVGPolygonElement, unknown, HTMLElement, any>;
  svgRise: d3.Selection<SVGPolylineElement, unknown, HTMLElement, any>;

  setD3(): void {
    this.svg = d3.select(`#${this.selector}`);

    this.svgText = this.svg.select(".step-plan-text");
    this.svgRise = this.svg.select(".step-plan-rise");
    this.svgStep = this.svg.select(".step-plan-lines");

    if (this.model.last) {
      this.classes = ["last"];
    } else {
      this.classes = [];
    }
  }
  drawWhenNotVisible(): void {
    this.svgStep.attr("points", "");
    this.svgRise.attr("points", "");
    this.svgText.text("");
  }
  initDraw(): void {
    this.svgStep.attr(
      "points",
      [
        this.model.walkLineXY,
        this.model.stringerXY,
        this.model.innerCorner,
        this.model.nextStingerXY,
        this.model.nextWalkLineXY,
        this.model.nextOuterStinger,
        this.model.outerCorner,
        this.model.outerStinger,
      ].join(" ")
    );

    this.svgRise.attr(
      "points",
      [
        angleXY(
          this.model.riseDeg + 90,
          this.model.parent.nose,
          this.model.outerStinger
        ),
        angleXY(
          this.model.riseDeg + 90,
          this.model.parent.nose,
          this.model.stringerXY
        ),
      ].join(" ")
    );

    this.svgText
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr(
        "transform",
        `translate(${this.model.textXY[0]}, ${this.model.textXY[1]})`
      )
      .text(this.model.index);
  }
  updateScale(): void {
    if (this.svgText) {
      this.svgText.attr("font-size", this.meterPerPixel * this.fontSize);
    }
    if (this.svgRise) {
      this.svgRise.attr(
        "stroke-width",
        this.meterPerPixel * this.lineThickness * 1
      );
    }
    if (this.svgStep) {
      this.svgStep.attr(
        "stroke-width",
        this.meterPerPixel * this.lineThickness * 1
      );
    }
  }
}
