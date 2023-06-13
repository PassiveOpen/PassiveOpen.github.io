import * as d3 from "d3";
import { HousePartSVG } from "../model/housePart.model";
import { Stud } from "../stud.model";

export class StudSVG extends HousePartSVG<Stud> {
  svgPolygon: d3.Selection<SVGPolygonElement, unknown, HTMLElement, any>;

  setD3() {
    this.svg = d3.select(`#${this.selector}`);
    this.svgPolygon = this.svg.append("polygon");
  }

  drawWhenNotVisible() {
    this.svgPolygon.attr("points", "");
  }

  initDraw() {
    this.svgPolygon.attr("points", this.model.coords.join(" "));
  }

  updateScale() {
    if (this.svgPolygon) {
      this.svgPolygon.attr("stroke-width", this.meterPerPixel * 2);
    }
  }
}
