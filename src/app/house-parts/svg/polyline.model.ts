import * as d3 from "d3";
import { xy } from "src/app/house/house.model";
import { HousePartSVG } from "../model/housePart.model";
import { Other } from "../other.model";

export class PolylineSVG extends HousePartSVG<Other> {
  coords: xy[] = [];
  dash: number[] = [];
  svgLine: d3.Selection<SVGPolylineElement, unknown, HTMLElement, any>;

  setD3() {
    this.svg = d3.select(`#${this.selector}`);
  }

  drawWhenNotVisible() {
    this.svg.attr("points", "");
  }

  initDraw() {
    this.svg.attr("points", this.model.coords.join(" "));
    this.setClass(this.svg);
  }

  updateScale() {
    this.svg
      .attr("stroke-width", this.meterPerPixel * this.lineThickness)
      .attr(
        "stroke-dasharray",
        this.dash
          .map((x) => x * this.meterPerPixel * this.lineThickness)
          .join(" ")
      );
  }
}
