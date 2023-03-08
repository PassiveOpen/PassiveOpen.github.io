import { SafeHtml } from "@angular/platform-browser";
import * as d3 from "d3";
import { House, xy } from "../../house/house.model";
import { Floor } from "../../components/enum.data";
import { BaseSVG } from "../base.model";
import { offset, ptToScale, round } from "src/app/shared/global-functions";
export class Room extends BaseSVG {
  coords: xy[] = [];
  floor = Floor.ground;
  parent: House;
  hole = false;
  centralElectricity: xy = [0, 0];
  theoretic = false;

  function: string;

  northWestCorner: xy;
  width = 0;
  height = 0;
  fontSize = 12;
  svgText: d3.Selection<SVGTextElement, unknown, HTMLElement, any>;
  svgText1: d3.Selection<SVGTSpanElement, unknown, HTMLElement, any>;
  svgText2: d3.Selection<SVGTSpanElement, unknown, HTMLElement, any>;
  svgRoom: d3.Selection<SVGPolygonElement, unknown, HTMLElement, any>;

  constructor(data: Partial<Room>) {
    super();
    Object.assign(this, data);
  }
  setup(): void {}

  async draw(floor: Floor) {
    if (this.svg === undefined) {
      this.svg = d3.select(`#${this.selector}`);
      this.svgRoom = this.svg.append("polygon");
      if (this.function) {
        this.svgText = this.svg.append("text");
        this.svgText1 = this.svgText.append("tspan");
        this.svgText2 = this.svgText.append("tspan");
        this.svgText.attr("class", "room-function-text");
      }
      if (!this.name) this.name = this.selector;
      this.classes = [`floor-${this.floor}`];
      if (this.hole) {
        this.classes.push("room-hole");
        this.svg.attr("filter", "url(#inset-shadow)");
      }
      this.classes.push("bg-fill");
    }

    if (!this.show(floor)) {
      this.svgRoom.attr("points", "");
      if (this.function) {
        this.svgText1.text("");
        this.svgText2.text("");
      }
      return;
    }
    this.svgRoom.attr("points", this.coords.join(" "));

    const getCenter = () => {
      const x = this.coords.map((c) => c[0]);
      const y = this.coords.map((c) => c[1]);
      const xMin = Math.min(...x);
      const xMax = Math.max(...x);
      const yMin = Math.min(...y);
      const yMax = Math.max(...y);
      return [(xMin + xMax) / 2, (yMin + yMax) / 2];
    };
    const textOrigin = this.center ? this.center : getCenter();
    if (this.function) {
      this.svgText
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("transform", `translate(${textOrigin[0]} ${textOrigin[1]}) `);

      this.svgText1.attr("x", 0).attr("dy", "0em").text(`${this.function}`);
      if (this.area() > 5) {
        this.svgText2
          .attr("x", 0)
          .attr("dy", "1.2em")
          .text(`${this.area()} m²`);
      }
    }

    this.setClass(this.svg);
  }

  tooltip = (): SafeHtml => {
    console.log(this.selector);

    let str = `Room <b>${this.name}</b> 
    <br>${this.floor}-level
    <br>${this.area()}m2`;

    if (this.width) str += `<br>width: ${this.width}m`;
    if (this.height) str += `<br>height: ${this.height}m`;

    return str;
  };

  area = () => {
    if (this.coords.length === 0 || this.hole) {
      return 0;
    }
    return Math.abs(round(d3.polygonArea(this.coords), 1));
  };
  volume = () => {
    // todo
    if (this.floor === Floor.top || this.hole) {
      return this.area() * this.parent.cross.ceilingHeight;
    }
    if (this.floor === Floor.ground || this.hole) {
      return this.area() * this.parent.cross.ceilingHeight;
    }
  };

  squaredRoom = (width, height) => {
    this.width = round(width);
    this.height = round(height);
    this.coords = [
      this.northWestCorner,
      offset(this.northWestCorner, [width, 0]),
      offset(this.northWestCorner, [width, height]),
      offset(this.northWestCorner, [0, height]),
    ];

    this.center = offset(this.northWestCorner, [width / 2, height / 2]);
    this.centralElectricity = this.center;
  };

  redraw(floor: Floor) {
    if (this.svgRoom) {
    }
    if (this.svgText) {
      this.svgText
        .attr(
          "font-size",
          ptToScale(this.fontSize, this.meterPerPixel, this.svgUpdate.print)
        )
        .attr("stroke-width", this.meterPerPixel * 6);
    }
  }
}
