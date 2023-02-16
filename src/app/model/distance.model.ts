import { Cross } from "../house/cross.model";
import { House, xy } from "../house/house.model";
import * as d3 from "d3";
import { BaseSVG } from "./base.model";
import { Floor } from "../components/enum.data";
import {
  angleBetween,
  centerBetweenPoints,
  distanceBetweenPoints,
  offset,
  round,
} from "../shared/global-functions";

export class AppDistance extends BaseSVG {
  selector = "g-distance";
  point1: xy = [-999, -999];
  point2: xy = undefined;

  svgText: d3.Selection<SVGTextElement, unknown, HTMLElement, any>;
  svgTextAngle: d3.Selection<SVGTextElement, unknown, HTMLElement, any>;
  svgLine: d3.Selection<SVGPolylineElement, unknown, HTMLElement, any>;
  svgCircle1: d3.Selection<SVGCircleElement, unknown, HTMLElement, any>;
  svgCircle2: d3.Selection<SVGCircleElement, unknown, HTMLElement, any>;

  constructor() {
    super();
    this.floor = Floor.all;
  }
  onUpdate = () => {}; // not used
  async draw(floor: Floor) {
    if (this.svg === undefined) {
      this.svg = d3.select(`#${this.selector}`);

      this.svgCircle1 = this.svg
        .append("circle")
        .style("fill", "var(--accent-color)")
        .style("cursor", "crosshair")
        .attr("stroke-width", 0);
      this.svgCircle2 = this.svg
        .append("circle")
        .style("cursor", "crosshair")
        .style("fill", "var(--accent-color)")
        .attr("stroke-width", 0);
      this.svgLine = this.svg
        .append("polyline")
        .style("stroke", "var(--accent-color)");
      this.svgText = this.svg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("paint-order", "stroke")
        .style("fill", "var(--color-100)")
        .style("stroke", "var(--color-0)");
      this.svgTextAngle = this.svg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("paint-order", "stroke")
        .style("fill", "var(--color-100)")
        .style("stroke", "var(--color-0)");
    }

    if (!this.show(floor)) {
      this.clear();
      return;
    }

    this.svgCircle1.attr("cx", this.point1[0]).attr("cy", this.point1[1]);
    if (!this.point2) {
      this.clearExceptFirst();
      return;
    }
    this.svgCircle2.attr("cx", this.point2[0]).attr("cy", this.point2[1]);
    this.svgLine.attr("points", [this.point1, this.point2].join(" "));

    const meter = distanceBetweenPoints(this.point1, this.point2);

    const toMeasure = (meter) => {
      if (meter < 1200) {
        return `${round(meter * 1000, 0)}mm`;
      } else {
        return `${round(meter, 3)}m`;
      }
    };
    this.svgText.text(toMeasure(meter));
    this.svgTextAngle.text(
      `${Math.abs(angleBetween(this.point1, this.point2, 0))}°`
    );

    this.setClass(this.svg);
  }

  clear() {
    this.clearExceptFirst();
    this.svgCircle1.attr("cx", -999).attr("cy", -999);
  }

  clearExceptFirst() {
    this.svgCircle2.attr("cx", -999).attr("cy", -999);
    this.svgText.attr("transform", `translate(${-999}, ${-999})`);
    this.svgTextAngle.attr("transform", `translate(${-999}, ${-999})`);
    this.svgLine.attr("points", []);
  }
  redraw(floor: Floor) {
    if (this.svgCircle1) {
      this.svgCircle1.attr("r", this.meterPerPixel * 4);
    }
    if (this.svgCircle2) {
      this.svgCircle2.attr("r", this.meterPerPixel * 4);
    }
    if (this.svgLine) {
      this.svgLine.attr("stroke-width", this.meterPerPixel * 2);
    }
    if (this.svgText && this.svgTextAngle && this.point2) {
      const [x, y] = offset(centerBetweenPoints(this.point1, this.point2), [
        0,
        this.meterPerPixel * -20,
      ]);
      this.svgText
        .attr("transform", `translate(${x}, ${y})`)
        .attr("stroke-width", 6 * this.meterPerPixel)
        .attr("font-size", this.meterPerPixel * 16);

      const [x1, y1] = offset(this.point1, [this.meterPerPixel * -20, 0]);
      this.svgTextAngle
        .attr("transform", `translate(${x1}, ${y1})`)
        .attr("stroke-width", 6 * this.meterPerPixel)
        .attr("font-size", this.meterPerPixel * 16);
    }
  }
}
