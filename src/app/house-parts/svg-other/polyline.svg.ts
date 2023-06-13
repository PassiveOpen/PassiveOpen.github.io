import * as d3 from "d3";
import { HousePartSVG } from "../model/housePart.model";
import { Other } from "../other.model";

export class PolylineSVG extends HousePartSVG<Other<PolylineSVG>> {
  dash: number[] = [];
  type = "polyline";
  svgPolyline: d3.Selection<
    SVGPolylineElement,
    unknown,
    HTMLElement,
    undefined
  >;

  setD3() {
    this.svg = d3.select(`#${this.selector}`);
    this.svgPolyline = this.svg.append("polyline");
  }

  drawWhenNotVisible() {
    this.svgPolyline.attr("points", "");
  }

  initDraw() {
    this.svgPolyline.attr("points", this.model.coords.join(" "));
  }

  updateScale() {
    this.svgPolyline
      .attr("stroke-width", this.meterPerPixel * this.lineThickness)
      .attr(
        "stroke-dasharray",
        this.dash
          .map((x) => x * this.meterPerPixel * this.lineThickness)
          .join(" ")
      );
  }
}
