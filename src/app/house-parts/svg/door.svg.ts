import * as d3 from "d3";
import { Door } from "../door.model";
import { HousePartSVG } from "../model/housePart.model";
import { Wall } from "../wall.model";

export class DoorSVG extends HousePartSVG<Door> {
  parent: Wall;
  svgOpening: d3.Selection<SVGPolygonElement, unknown, HTMLElement, any>;
  svgSwing: d3.Selection<SVGPathElement, unknown, HTMLElement, any>;

  setD3(): void {
    this.svg = d3.select(`#${this.selector}`);
    this.svgOpening = this.svg.select(".door-wall-opening");
    this.svgSwing = this.svg.select(".door-swing");
  }
  drawWhenNotVisible(): void {
    this.svgOpening.attr("points", "");
    this.svgSwing.attr("d", "");
  }
  initDraw(): void {
    let extra;
    if (this.model.scale[0] === 1) {
      extra = [0, 0];
    } else {
      extra = [this.model.parent.thickness, 0];
    }

    this.svg.style(
      "transform",
      ` 
      translate(${this.model.origin[0] + extra[0]}px, ${
        this.model.origin[1] + extra[1]
      }px) 
      rotate(${this.model.rotate}deg) 
      scale(${this.model.scale[0]}, ${this.model.scale[1]})
      `
    );

    this.svgOpening
      .attr(
        "points",

        [
          [0, -this.model.width],
          [this.model.parent.thickness, -this.model.width],
          [this.model.parent.thickness, 0],
          [0, 0],
        ].join(" ")
      )
      .attr("class", "bg-fill");
    this.svgSwing.attr(
      "d",
      `M${this.model.parent.thickness},0 
        L0,0  
        L${-this.model.width},0  
        A${this.model.width},${this.model.width} 0 0,1  
        ${0},${-this.model.width}
        L${this.model.parent.thickness},${-this.model.width}`
    );
  }
  updateScale(): void {
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
