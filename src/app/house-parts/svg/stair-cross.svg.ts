import * as d3 from "d3";
import { angleXY } from "src/app/shared/global-functions";
import { HousePartSVG } from "../model/housePart.model";
import { StairModel } from "../stair-plan.model";

export class StairCrossSVG extends HousePartSVG<StairModel> {
  fontSize = 10;
  svgRun: d3.Selection<SVGPolygonElement, unknown, HTMLElement, any>;
  svgRise: d3.Selection<SVGPolygonElement, unknown, HTMLElement, any>;
  svgText: d3.Selection<SVGTextElement, unknown, HTMLElement, any>;

  setD3(): void {
    this.svg = d3.select(`#${this.selector}`);

    this.svgRun = this.svg.select<SVGPolylineElement>(".step-run");
    this.svgRise = this.svg.select<SVGPolylineElement>(".step-rise");
    this.svgText = this.svg.select<SVGTextElement>(".step-text");

    if (this.model.last) {
      this.classes = ["last"];
    } else {
      this.classes = [];
    }
  }
  drawWhenNotVisible(): void {
    this.svgRun.attr("points", "");
    this.svgRise.attr("points", "");
    this.svgText.text("");
  }
  initDraw(): void {
    const run = this.model.parent.run;
    const rise = this.model.parent.rise;
    const nose = this.model.parent.nose;
    const runThickness = this.model.parent.runThickness;
    const riseThickness = this.model.parent.riseThickness;

    this.svg.attr(
      "transform",
      `translate(${this.model.index * run}, ${-this.model.index * rise})`
    );
    this.setClass(this.svg);

    this.svgRun
      .attr("stroke-width", this.meterPerPixel * this.lineThickness)
      .attr(
        "points",
        [
          [0, 0],
          [0, runThickness],
          [this.model.last ? nose : run + riseThickness + nose, runThickness],
          [this.model.last ? nose : run + riseThickness + nose, 0],
        ].join(" ")
      );
    this.svgRise
      .attr("stroke-width", this.meterPerPixel * this.lineThickness)
      .attr(
        "points",
        [
          [nose, runThickness],
          [nose, rise],
          [nose + riseThickness, rise],
          [nose + riseThickness, runThickness],
        ].join(" ")
      );

    this.svgText
      .attr("font-size", this.fontSize * this.meterPerPixel)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("stroke-width", 6 * this.meterPerPixel)
      .attr(
        "transform",
        `
        translate(${run / 2} ${-this.meterPerPixel * 16}) 
        `
      )
      .text(this.model.index);
  }
  updateScale(): void {
    this.svgText?.attr("font-size", this.meterPerPixel * this.fontSize);
    this.svgRise?.attr(
      "stroke-width",
      this.meterPerPixel * this.lineThickness * 1
    );
    this.svgRun?.attr(
      "stroke-width",
      this.meterPerPixel * this.lineThickness * 1
    );
  }
}
