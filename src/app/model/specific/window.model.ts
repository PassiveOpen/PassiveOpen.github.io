import { SafeHtml } from "@angular/platform-browser";
import * as d3 from "d3";
import { House } from "../../house/house.model";
import { Cross } from "../../house/cross.model";
import { Wall } from "./wall.model";
import { BaseSVG } from "../base.model";
import { Floor } from "../../components/enum.data";
export enum WindowForm {
  windowWall = "windowWall",
  standard = "standard",
  hexagon = "hexagon",
}
export class Window extends BaseSVG {
  floor = Floor.ground;
  windowForm = WindowForm.standard;
  parent: Wall;
  width = 2;
  height = 2;
  origin = [0, 0];
  scale = [1, 1];
  rotate = 0;
  svgOpening: d3.Selection<SVGPolygonElement, unknown, HTMLElement, any>;
  svgPane: d3.Selection<SVGPathElement, unknown, HTMLElement, any>;
  frameThickness = 0.1;
  frameDepth = 0.1;
  innerDepthFrame = 0.1;
  openable = true;

  get outerDepthFrame() {
    return this.innerDepthFrame + this.frameDepth;
  }

  constructor(data: Partial<Window>) {
    super();
    Object.assign(this, data);
  }

  async draw(floor: Floor) {
    if (this.svg === undefined) {
      this.svg = d3.select(`#${this.selector}`);
      this.svgOpening = this.svg.select(".window-wall-opening");
      this.svgPane = this.svg.select(".window-pane");
    }
    if (!this.show(floor)) {
      this.svgOpening.attr("points", "");
      this.svgPane.attr("d", "");
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
          [0, this.width],
          [this.parent.thickness, this.width],
          [this.parent.thickness, 0],
          [0, 0],
        ].join(" ")
      )
      .attr("class", "bg-fill");

    this.svgPane.attr(
      "d",
      `M${this.innerDepthFrame},${0}  
          L${this.innerDepthFrame},${this.frameThickness} 
          L${this.outerDepthFrame},${this.frameThickness}  
          L${this.outerDepthFrame},${0}  
          
          L${this.outerDepthFrame},${this.width}  
          L${this.outerDepthFrame},${this.width - this.frameThickness}  
          L${this.innerDepthFrame},${this.width - this.frameThickness} 
          L${this.innerDepthFrame},${this.width}  

          L${this.innerDepthFrame},${0}  
          L${this.innerDepthFrame},${this.frameThickness} 
          L${this.innerDepthFrame + this.frameDepth / 2},${
        this.frameThickness
      }  
          L${this.innerDepthFrame + this.frameDepth / 2},${
        this.width - this.frameThickness
      }  
          `
    );
  }

  redraw(floor: Floor) {
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
}
