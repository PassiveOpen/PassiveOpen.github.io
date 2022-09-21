import { SafeHtml } from "@angular/platform-browser";
import * as d3 from "d3";
import { House } from "../../house/house.model";
import { Cross } from "../../house/cross.model";
import { Wall } from "./wall.model";
import { BaseSVG } from "../base.model";
import { Floor } from "../../components/enum.data";

export class Door extends BaseSVG {
  parent: Wall;
  width = 0.8;
  origin = [0, 0];
  scale = [1, 1];
  rotate = 0;
  outside = false;
  svgOpening: d3.Selection<SVGPolygonElement, unknown, HTMLElement, any>;
  svgSwing: d3.Selection<SVGPathElement, unknown, HTMLElement, any>;

  constructor(data: Partial<Door>) {
    super();
    Object.assign(this, data);
  }

  async draw(floor: Floor) {
    if (this.svg === undefined) {
      this.svg = d3.select(`#${this.selector}`);

      this.svgOpening = this.svg.select(".door-wall-opening");
      this.svgSwing = this.svg.select(".door-swing");
    }
    if (!this.show(floor)) {
      this.svgOpening.attr("points", "");
      this.svgSwing.attr("d", "");
      return;
    }
    let extra;
    if (this.scale[0] === 1) {
      extra = [0, 0];
    } else {
      extra = [this.parent.thickness, 0];
    }

    this.svg.style(
      "transform",
      ` 
      translate(${this.origin[0] + extra[0]}px, ${this.origin[1] + extra[1]}px) 
      rotate(${this.rotate}deg) 
      scale(${this.scale[0]}, ${this.scale[1]})
      `
    );

    this.svgOpening
      .attr(
        "points",

        [
          [0, -this.width],
          [this.parent.thickness, -this.width],
          [this.parent.thickness, 0],
          [0, 0],
        ].join(" ")
      )
      .attr("class", "bg-fill");
    this.svgSwing.attr(
      "d",
      `M${this.parent.thickness},0 
        L0,0  
        L${-this.width},0  
        A${this.width},${this.width} 0 0,1  
        ${0},${-this.width}
        L${this.parent.thickness},${-this.width}`
    );
  }

  redraw(floor: Floor) {
    if (this.svgOpening) {
      this.svgOpening.attr(
        "stroke-width",
        this.meterPerPixel * this.lineThickness
      );
    }
    if (this.svgSwing) {
      this.svgSwing.attr("stroke-width", this.meterPerPixel * 1);
    }
  }
}
