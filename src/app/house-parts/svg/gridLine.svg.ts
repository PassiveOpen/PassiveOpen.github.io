import * as d3 from "d3";
import { House } from "../../house/house.model";
import { GridLine } from "../gridLine.model";
import { HousePartSVG } from "../model/housePart.model";

export class GridLineSVG extends HousePartSVG<GridLine> {
  parent: House;

  function: string;

  width = 0;
  height = 0;

  setD3() {
    this.svg = d3.select(`#${this.selector}`);
    if (!this.name) this.name = this.selector;
    this.classes = [`floor-${this.floor}`];
  }

  drawWhenNotVisible() {
    this.svg.attr("points", "");
  }

  initDraw() {
    this.svg.attr("points", this.model.coords.join(" "));
  }

  updateScale() {
    if (this.svg) {
      this.svg.attr("stroke-width", this.meterPerPixel * 2);
    }
  }
}
