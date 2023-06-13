import * as d3 from "d3";
import { HousePartSVG } from "../model/housePart.model";
import { Other } from "../other.model";

export class PolygonSVG extends HousePartSVG<Other<PolygonSVG>> {
  fill: string = "";
  dash: number[] = [];
  type = "polygon";
  svgPolygon: d3.Selection<SVGPolygonElement, unknown, HTMLElement, undefined>;

  setD3() {
    this.svg = d3.select(`#${this.selector}`);
    this.svgPolygon = this.svg.append("polygon");
    this.svgPolygon.attr("fill", this.fill);
  }

  drawWhenNotVisible() {
    this.svgPolygon.attr("points", "");
  }

  initDraw() {
    this.svgPolygon
      .attr("points", this.model.coords.join(" "))
      .attr("transform", this.transform);
  }

  updateScale() {
    this.svgPolygon
      .attr("stroke-width", this.meterPerPixel * this.lineThickness)
      .attr(
        "stroke-dasharray",
        this.dash
          .map((x) => x * this.meterPerPixel * this.lineThickness)
          .join(" ")
      );
  }
}
