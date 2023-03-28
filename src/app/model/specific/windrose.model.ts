import * as d3 from "d3";
import { House } from "../../house/house.model";
import { BaseSVG } from "../base.model";
import { Floor } from "../../components/enum.data";

export class Windrose<T = {}> extends BaseSVG<T> {
  parent: T;
  origin = [0, 0];
  scale = [1, 1];
  rotate = 0;
  svg1: d3.Selection<SVGPolygonElement, unknown, HTMLElement, any>;
  svg2: d3.Selection<SVGPathElement, unknown, HTMLElement, any>;
  svgText: d3.Selection<SVGTextElement, unknown, HTMLElement, any>;

  constructor(data: Partial<Windrose<T>>) {
    super();
    Object.assign(this, data);
  }

  async draw(floor: Floor) {
    if (this.svg === undefined) {
      if (!this.show(floor)) return;
      this.svg = d3.select(`#${this.selector}`);

      this.svg1 = this.svg.select(".house-wind-rose-1");
      this.svg2 = this.svg.select(".house-wind-rose-2");
      this.svgText = this.svg.select(".house-wind-rose-text");
    }

    this.svg.style(
      "transform",
      ` 
      translate(${this.origin[0]}px, ${this.origin[1]}px) 
      rotate(${this.rotate}deg) 
      scale(${this.scale[0]}, ${this.scale[1]})
      `
    );

    this.svg1
      .attr(
        "points",
        [
          [0, 0],
          [10, 30],
          [0, 20],
        ]
          .map(([x, y]) => [x * this.meterPerPixel, y * this.meterPerPixel])
          .join(" ")
      )
      .attr("stroke-width", 1);
    this.svg2
      .attr(
        "points",
        [
          [0, 0],
          [-10, 30],
          [0, 20],
        ]
          .map(([x, y]) => [x * this.meterPerPixel, y * this.meterPerPixel])
          .join(" ")
      )
      .attr("stroke-width", 1);

    const textOffset = [0, 0];
    this.svgText
      .attr("font-size", 12)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("stroke-width", 6)
      .attr(
        "transform",
        `
          translate(0 ${-8 * this.meterPerPixel}) 
          rotate(${this.rotate})
          `
      )
      .text("North");
  }
}
