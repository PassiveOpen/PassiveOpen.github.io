import { House } from "../../house/house.model";
import * as d3 from "d3";
import { Floor } from "../../components/enum.data";
import { BaseSVG } from "../base.model";

export class Figure extends BaseSVG {
  coords: number[][] = [[], []];
  svg: d3.Selection<SVGGElement, unknown, HTMLElement, undefined>;
  classes;
  

  async draw(floor: Floor) {
    if (this.svg === undefined) {
      if (!this.show(floor)) return;
      this.svg = d3.select(this.selector).append("polygon");
      this.svg.attr("id", this.selector.replace(/[\.#]/gi, ""));
    }

    this.svg
      .attr("points", this.coords.join(" "))
      .attr("classes", this.classes);
  }

  redraw(floor: Floor) {
    if (this.svg) {
      this.svg.attr("stroke-width", this.meterPerPixel * this.lineThickness);
    }
  }
}
