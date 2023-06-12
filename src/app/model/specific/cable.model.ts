import * as d3 from "d3";
import { BaseSVG } from "../base.model";
import { Floor, SensorType } from "../../components/enum.data";
import { Wall } from "../../house-parts/wall.model";
import { Room } from "../../house-parts/room.model";
import { SafeHtml } from "@angular/platform-browser";
import { round } from "src/app/shared/global-functions";

export class Cable extends BaseSVG {
  name;
  parent: Room;
  points: [number, number][] | number[][] = [];
  sensor: SensorType;
  offset = [0, 0];

  otherAngle = false;

  constructor(data: Partial<Cable>) {
    super();
    Object.assign(this, data);
  }

  async draw(floor: Floor) {
    if (this.svg === undefined) {
      if (!this.show(floor)) return;
      this.svg = d3.select(`.sensor-cable${this.selector}`);
    }

    this.svg
      .attr("points", this.points.join(" "))
      .attr("transform", this.transform);
  }

  getCableLength() {
    const dist = (p1, p2) => Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    let length = 0;
    this.points.forEach((p, i, arr) => {
      if (i + 1 === this.points.length) return;
      length += dist(p, arr[i + 1]);
    });
    return round(length, 0);
  }

  redraw(floor: Floor) {
    if (this.svg) {
      this.svg.attr("stroke-width", this.meterPerPixel * this.lineThickness);
    }
  }
}
