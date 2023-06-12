import { Cross } from "../house/cross.model";
import { House, xy } from "../house/house.model";
import * as d3 from "d3";
import { BaseSVG } from "./base.model";
import { Floor } from "../components/enum.data";

export class AppPolyline extends BaseSVG {
  coords: xy[] = [];
  dash: number[] = [];

  constructor(data: Partial<AppPolyline>) {
    super();
    Object.assign(this, data);
  }

  async draw(floor: Floor) {
    if (this.svg === undefined) {
      this.svg = d3.select(`#${this.selector}`);
    }

    if (this.show(floor) === false) {
      this.svg.attr("points", "");
      return;
    }

    this.svg
      .attr("points", this.coords.join(" "))
      .attr("transform", this.transform);

    this.setClass(this.svg);
  }

  redraw(floor: Floor) {
    if (this.svg === undefined) {
      this.draw(floor);
    }
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
