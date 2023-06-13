import * as d3 from "d3";
import { HousePartSVG } from "../model/housePart.model";
import { Other } from "../other.model";

export class CircleSVG extends HousePartSVG<Other<CircleSVG>> {
  dash: number[] = [];
  type = "circle";
  svgCircle: d3.Selection<SVGCircleElement, unknown, HTMLElement, undefined>;

  cx = 0;
  cy = 0;
  r = 1;
  _lineThickness = 0.2;

  setD3() {
    this.svg = d3.select(`#${this.selector}`);
    this.svgCircle = this.svg.append("circle");
  }

  drawWhenNotVisible() {
    this.svgCircle.attr("d", "");
  }

  initDraw() {
    this.svgCircle.attr("cx", this.cx).attr("cy", this.cy).attr("r", this.r);
  }

  updateScale() {
    this.svgCircle
      .attr("stroke-width", this.meterPerPixel * this.lineThickness)
      .attr(
        "stroke-dasharray",
        this.dash
          .map((x) => x * this.meterPerPixel * this.lineThickness)
          .join(" ")
      )
      .attr("transform", this.transform);
  }
}
