import { HousePartSVG } from "../model/housePart.model";
import * as d3 from "d3";
import { Window } from "../window.model";
import { SafeHtml } from "@angular/platform-browser";
import { round } from "@turf/turf";

export class WindowSVG extends HousePartSVG<Window> {
  svgOpening: d3.Selection<SVGPolygonElement, unknown, HTMLElement, any>;
  svgPane: d3.Selection<SVGPathElement, unknown, HTMLElement, any>;

  setD3(): void {
    this.svg = d3.select(`#${this.model.selector}`);
    this.svgOpening = this.svg.select(".window-wall-opening");
    this.svgPane = this.svg.select(".window-pane");
  }

  drawWhenNotVisible(): void {
    this.svgOpening.attr("points", "");
    this.svgPane.attr("d", "");
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
          [0, this.model.width],
          [this.model.parent.thickness, this.model.width],
          [this.model.parent.thickness, 0],
          [0, 0],
        ].join(" ")
      )
      .attr("class", "bg-fill");

    this.svgPane.attr(
      "d",
      `M${this.model.innerDepthFrame},${0}  
          L${this.model.innerDepthFrame},${this.model.frameThickness} 
          L${this.model.outerDepthFrame},${this.model.frameThickness}  
          L${this.model.outerDepthFrame},${0}  
          
          L${this.model.outerDepthFrame},${this.model.width}  
          L${this.model.outerDepthFrame},${
        this.model.width - this.model.frameThickness
      }  
          L${this.model.innerDepthFrame},${
        this.model.width - this.model.frameThickness
      } 
          L${this.model.innerDepthFrame},${this.model.width}  

          L${this.model.innerDepthFrame},${0}  
          L${this.model.innerDepthFrame},${this.model.frameThickness} 
          L${this.model.innerDepthFrame + this.model.frameDepth / 2},${
        this.model.frameThickness
      }  
          L${this.model.innerDepthFrame + this.model.frameDepth / 2},${
        this.model.width - this.model.frameThickness
      }  
          `
    );
  }
  updateScale(): void {
    if (this.svgOpening) {
      this.svgOpening.attr(
        "stroke-width",
        this.meterPerPixel * this.lineThickness
      );
    }
    if (this.svgPane) {
      this.svgPane.attr("stroke-width", this.meterPerPixel * 1);
    }
  }

  tooltip = (): SafeHtml => {
    console.log(this.selector);

    let str = `Window <b>${this.name} / ${this.selector}</b> 
    <br>${round(this.model.width, 1)} x ${round(this.model.height, 1)}m}
    <br>ELevation: ${round(this.model.elevation, 1)}
    `;

    return str;
  };
}
