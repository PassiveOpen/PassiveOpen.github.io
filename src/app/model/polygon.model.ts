import * as d3 from "d3";
import { Floor } from "../components/enum.data";
import { xy } from "../house/house.model";
import { BaseSVG } from "./base.model";

export class AppPolygon extends BaseSVG {
  name = "";
  coords: xy[] = [];

  constructor(data: Partial<AppPolygon>) {
    super();
    Object.assign(this, data);
  }

  async draw(floor: Floor) {
    if (this.svg === undefined) {
      this.svg = d3.select(`#${this.selector}`);
    }

    if (!this.show(floor)) {
      this.svg.attr("points", "");
      return;
    }

    this.svg
      .attr("points", this.coords.join(" "))
      .attr("transform", this.transform);
    this.setClass(this.svg);
  }

  redraw(floor: Floor) {
    if (this.svg !== undefined) {
      this.svg.attr("stroke-width", this.meterPerPixel * this.lineThickness);
    } else {
      console.log("error! svg = undefined", `#${this.selector}`, this.svg);
    }
  }

  square(w: number, h: number, origin: xy) {
    this.coords = [
      [origin[0], origin[1]],
      [origin[0] + w, origin[1]],
      [origin[0] + w, origin[1] + h],
      [origin[0], origin[1] + h],
    ];
  }
}
