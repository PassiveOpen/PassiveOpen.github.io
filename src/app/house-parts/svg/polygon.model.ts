import * as d3 from "d3";
import { Floor } from "../../components/enum.data";
import { xy } from "../../house/house.model";
import { BaseSVG } from "../../model/base.model";
import { HousePartSVG } from "../model/housePart.model";
import { Other } from "../other.model";

export class PolygonSVG extends HousePartSVG<Other> {
  name = "";
  coords: xy[] = [];

  setD3() {
    this.svg = d3.select(`#${this.selector}`);
  }

  drawWhenNotVisible() {
    this.svg.attr("points", "");
  }

  initDraw() {
    this.svg
      .attr("points", this.model.coords.join(" "))
      .attr("transform", this.transform);
    this.setClass(this.svg);
  }

  updateScale() {
    this.svg.attr("stroke-width", this.meterPerPixel * this.lineThickness);
  }
}
