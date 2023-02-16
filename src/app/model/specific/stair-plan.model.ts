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
import { BaseSVG } from "../base.model";

export class AppStairPlan extends BaseSVG {
  floor = Floor.all;
  name = "step";
  parent: Stair;
  last = false;
  visible = true;
  fontSize = 10;
  svgText: d3.Selection<SVGTextElement, unknown, HTMLElement, any>;
  svgStep: d3.Selection<SVGPolygonElement, unknown, HTMLElement, any>;
  svgRise: d3.Selection<SVGPolylineElement, unknown, HTMLElement, any>;
  walkLineXY: xy = [0, 0];
  nextWalkLineXY: xy = [0, 0];
  stringerXY: xy = [0, 0];
  nextStingerXY: xy = [0, 0];
  stringers: Stringers;

  constructor(data: Partial<AppStairPlan>) {
    super();
    Object.assign(this, data);
  }

  async draw(floor: Floor) {
    if (this.svg === undefined) {
      this.svg = d3.select(`#${this.selector}`);

      this.svgText = this.svg.select(".step-plan-text");
      this.svgRise = this.svg.select(".step-plan-rise");
      this.svgStep = this.svg.select(".step-plan-lines");

      if (this.last) {
        this.classes.push("last");
      }
    }

    if (!this.show(floor)) {
      this.svgStep.attr("points", "");
      this.svgRise.attr("points", "");
      this.svgText.text("");
      return;
    }

    const direction = angleBetween(this.walkLineXY, this.nextWalkLineXY);
    const textXY = angleXY(
      direction - 45,
      this.parent.run * 0.8,
      this.walkLineXY
    );

    const riseDeg = angleBetween(this.stringerXY, this.walkLineXY);
    const nextRiseDeg = angleBetween(this.nextStingerXY, this.nextWalkLineXY);
    const farOuterStingerXY = angleXY(riseDeg, 10, this.walkLineXY);
    const nextFarOuterStingerXY = angleXY(nextRiseDeg, 10, this.nextWalkLineXY);

    const outerStinger = multiLineIntersect(this.stringers.out.coords, [
      this.stringerXY,
      farOuterStingerXY,
    ])
      .map((x) => ({ xy: x, d: distanceBetweenPoints(x, this.stringerXY) }))
      .sort((a, b) => a.d - b.d)
      .map((x) => x.xy)[0];

    const nextOuterStinger = multiLineIntersect(this.stringers.out.coords, [
      this.nextStingerXY,
      nextFarOuterStingerXY,
    ])
      .map((x) => ({ xy: x, d: distanceBetweenPoints(x, this.nextStingerXY) }))
      .sort((a, b) => a.d - b.d)
      .map((x) => x.xy)[0];

    const corner1 = this.stringers.out.coords[1];
    const corner2 = this.stringers.out.coords[2];
    let outerCorner = null;
    let innerCorner = null;

    if (corner1[1] !== outerStinger[1] && corner1[1] === nextOuterStinger[1]) {
      innerCorner = this.stringers.in.coords[1];
      outerCorner = this.stringers.out.coords[1];
    }
    if (corner2[0] !== outerStinger[0] && corner2[0] === nextOuterStinger[0]) {
      innerCorner = this.stringers.in.coords[2];
      outerCorner = this.stringers.out.coords[2];
    }

    this.svgStep.attr(
      "points",
      [
        this.walkLineXY,
        this.stringerXY,
        innerCorner,
        this.nextStingerXY,
        this.nextWalkLineXY,
        nextOuterStinger,
        outerCorner,
        outerStinger,
      ].join(" ")
    );

    this.svgRise.attr(
      "points",
      [
        angleXY(riseDeg + 90, this.parent.nose, outerStinger),
        angleXY(riseDeg + 90, this.parent.nose, this.stringerXY),
      ].join(" ")
    );

    this.svgText
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("transform", `translate(${textXY[0]}, ${textXY[1]})`)
      .text(this.index);

    // this.svg.attr(
    //   'transform',
    //   `translate(${this.walkLineXY[0]}, ${this.walkLineXY[1]})`
    // );
    this.setClass(this.svg);
  }

  redraw(floor: Floor) {
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
