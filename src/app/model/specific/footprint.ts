import { SafeHtml } from "@angular/platform-browser";
import * as d3 from "d3";
import { House } from "../../house/house.model";
import { Floor } from "../../components/enum.data";
import { BaseSVG } from "../base.model";
import { offset, round } from "src/app/shared/global-functions";
export class Footprint extends BaseSVG {
  coords: [number, number][] = [];
  floor = Floor.ground;
  parent: House;
  theoretic = false;

  constructor(data: Partial<Footprint>) {
    super();
    Object.assign(this, data);
  }
  setup(): void {}

  async draw(floor: Floor) {
    if (this.svg === undefined) {
      this.svg = d3.select(`#${this.selector}`);
      if (!this.name) this.name = this.selector;
      this.classes = [`floor-${this.floor}`];
      this.classes.push("bg-fill");
    }

    if (!this.show(floor)) {
      this.svg.attr("points", "");
      return;
    }
    this.svg.attr("points", this.coords.join(" "));
    this.setClass(this.svg);
  }

  tooltip = (): SafeHtml => {
    console.log(this.selector);

    let str = `Footprint
    <br>${this.floor}-level
    <br>${this.area()}m2`;

    return str;
  };

  area = () => {
    return Math.abs(round(d3.polygonArea(this.coords), 1));
  };
}
