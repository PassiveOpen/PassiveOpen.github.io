import * as d3 from "d3";
import { HousePartSVG } from "../model/housePart.model";
import { Other } from "../other.model";

export class PathSVG extends HousePartSVG<Other<PathSVG>> {
  dash: number[] = [];
  d: string = "";
  transform: string = "";
  type = "path";
  svgPath: d3.Selection<SVGPathElement, unknown, HTMLElement, undefined>;

  setD3() {
    this.svg = d3.select(`#${this.selector}`);
    this.svgPath = this.svg.append("path");
  }

  drawWhenNotVisible() {
    this.svgPath.attr("d", "");
  }

  initDraw() {
    this.svgPath.attr("d", this.d);
  }

  updateScale() {
    this.svgPath
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
