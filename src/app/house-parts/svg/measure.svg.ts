import * as d3 from "d3";
import { HousePartSVG } from "../model/housePart.model";
import { Measure } from "../measure.model";
import { angleXY, ptToScale } from "src/app/shared/global-functions";
import { round } from "@turf/turf";
import { xy } from "src/app/house/house.model";

export class MeasureSVG extends HousePartSVG<Measure> {
  svgLine: d3.Selection<SVGPolylineElement, unknown, HTMLElement, any>;
  svgText: d3.Selection<SVGTextElement, unknown, HTMLElement, any>;
  svgArrow1: d3.Selection<SVGTextElement, unknown, HTMLElement, any>;
  svgArrow2: d3.Selection<SVGTextElement, unknown, HTMLElement, any>;

  fontSize = 12;
  _lineThickness = 0.6;
  classes: string[] = ["measure"];

  setD3(): void {
    this.svg = d3.select(`#${this.model.selector}`);
    this.svgLine = this.svg.append("polyline");
    this.svgArrow1 = this.svg.append("text");
    this.svgArrow2 = this.svg.append("text");
    this.svgText = this.svg.append("text");
  }
  drawWhenNotVisible(): void {
    this.svgLine.attr("points", "");
    this.svgText.text("");
    this.svgArrow1.text("");
    this.svgArrow2.text("");
  }
  initDraw(): void {
    let a: xy = [...this.model.a];
    let b: xy = [...this.model.b];
    let textOffset = [0, 0];
    if (this.model.direction === 90) {
      a = [a[0], Math.max(a[1], b[1])];
      b = [b[0], Math.max(a[1], b[1])];
    }
    if (this.model.direction === -90) {
      a = [a[0], Math.min(a[1], b[1])];
      b = [b[0], Math.min(a[1], b[1])];
    }
    if (this.model.direction === 0) {
      a = [Math.max(a[0], b[0]), a[1]];
      b = [Math.max(a[0], b[0]), b[1]];
    }
    if (this.model.direction === 180) {
      a = [Math.min(a[0], b[0]), a[1]];
      b = [Math.min(a[0], b[0]), b[1]];
    }
    const pixels = this.model.offsetPixels * this.meterPerPixel;

    const aX = angleXY(
      this.model.direction,
      pixels + this.model.offsetMeters,
      a
    );
    const bX = angleXY(
      this.model.direction,
      pixels + this.model.offsetMeters,
      b
    );
    const arrowSize = 0.3;
    const textOrigin = this.model.between(aX, bX);
    var aa = bX[0] - aX[0];
    var bb = bX[1] - aX[1];
    var lengthMeters = round(Math.sqrt(aa * aa + bb * bb), this.model.decimals);

    if (lengthMeters === 0) {
      this.svg.style("visibility", "hidden");
    } else {
      this.svg.style("visibility", "");
    }

    const coordMap = [this.model.a, a, aX, bX, b, this.model.b];

    if (coordMap.some((x) => isNaN(x[0]) || isNaN(x[1]))) {
      console.log(`Some NaN ${this.selector}`, coordMap);
      return;
    }

    this.svgLine.attr("points", coordMap.join(" "));

    this.svgText
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr(
        "transform",
        `
        translate(${textOrigin[0] + textOffset[0]} ${
          textOrigin[1] + textOffset[1]
        }) 
        rotate(${this.model.textRotate})
        `
      )
      .text(lengthMeters);

    let arrowCorrection = 90;
    if ([90, 0].includes(this.model.direction)) {
      arrowCorrection = -90;
    }

    this.svgArrow1
      .attr("text-anchor", "start")
      .attr("dominant-baseline", "central")
      .attr("stroke-width", 0)
      .attr(
        "transform",
        `
        translate(${aX[0]} ${aX[1]}) 
        rotate(${this.model.direction + arrowCorrection})
        `
      )
      .text("<");
    this.svgArrow2
      .attr("text-anchor", "start")
      .attr("dominant-baseline", "central")
      .attr("stroke-width", 0)
      .attr(
        "transform",
        `
          translate(${bX[0]} ${bX[1]}) 
          rotate(${this.model.direction + arrowCorrection + 180})
          `
      )
      .text("<");
  }
  updateScale(): void {
    if (this.svgArrow2) {
      this.svgArrow2.attr(
        "font-size",
        ptToScale(16, this.meterPerPixel, this.svgUpdate.print)
      );
      this.svgArrow1.attr(
        "font-size",
        ptToScale(16, this.meterPerPixel, this.svgUpdate.print)
      );
    }
    if (this.svgText) {
      this.svgText
        .attr(
          "font-size",
          ptToScale(this.fontSize, this.meterPerPixel, this.svgUpdate.print)
        )
        .attr("stroke-width", this.meterPerPixel * 6);
    }
    if (this.svgLine) {
      this.svgLine.attr(
        "stroke-width",
        this.meterPerPixel * this.lineThickness
      );
    }
  }
}
