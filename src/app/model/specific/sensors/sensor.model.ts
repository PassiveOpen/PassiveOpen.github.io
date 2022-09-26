import * as d3 from "d3";
import { BaseSVG } from "../../base.model";
import { CableType, Floor, SensorType } from "../../../components/enum.data";
import { Wall, WallSide } from "../wall.model";
import { Room } from "../room.model";
import { SafeHtml } from "@angular/platform-browser";
import { angleBetween, angleXY, round } from "src/app/shared/global-functions";
import { xy } from "src/app/house/house.model";

export class Sensor<T> extends BaseSVG {
  name;
  parent: T;
  points: xy[] = [];
  sensorType: SensorType;
  svgG: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  svgIcon: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  svgBadge: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  svgBadgeCircle: d3.Selection<SVGCircleElement, unknown, HTMLElement, any>;
  svgBadgeText: d3.Selection<SVGTextElement, unknown, HTMLElement, any>;
  offset = [0, 0];
  offsetWall = 0.3;
  elevation = 0.3;
  group: number;
  verticalCableLength = 0;
  via: Floor;
  cableOnly = false;
  sensorOnly = false;
  wallSide = WallSide.in;
  cableLength = 0;
  amount = 1;
  fontSize = 14;
  visible = false;
  showBadge = false;

  cableType: CableType;

  constructor(data: Partial<Sensor<T>>) {
    super();
    Object.assign(this, data);
  }

  getSensorType = (str: string) => {
    const a = Object.values(SensorType).find((y) => str.includes(y));
    return a;
  };
  async draw(floor: Floor) {
    if (this.svg === undefined) {
      if (!this.show(floor)) return;
      if (this.floor === undefined || floor in this.parent) {
        this.floor = (this.parent as any).floor;
      }
      this.svg = d3.select(`#${this.selector}.sensor-cable`);
      if (this.sensorType === SensorType.temperature) {
        this.sensorOnly = true;
      }
      if (!this.cableOnly) {
        // So it has a Icon
        this.svgG = d3.select(`#${this.selector}.sensor-g`);
        this.showBadge = this.amount >= 2 && this.svgG !== undefined;
        this.svgIcon = d3.select(`#${this.selector}.sensor-icon`);
        if (this.showBadge) {
          this.svgBadge = this.svgG.append("g");
          this.svgBadgeCircle = this.svgBadge.append("circle");
          this.svgBadgeText = this.svgBadge.append("text");
        }
      } else {
        this.lineThickness = 2;
        this.classes.push("sensor-room-cable");
      }
      if (this.group) this.classes.push(`el-group-${this.group}`);
      if (this.cableType) this.classes.push(`cable-${this.cableType}`);
      this.classes.push(`sensor-${this.sensorType}`);
    }

    if (!this.show(floor)) {
      if (this.svgIcon) this.svgIcon.attr("xlink:href", "");
      if (this.svg) this.svg.attr("points", "");
      if (this.svgBadgeCircle) this.svgBadgeCircle.attr("r", 0);
      if (this.svgBadgeText) this.svgBadgeText.attr("font-size", 0);

      this.showBadge = false;
      return;
    }

    if (this.svgIcon) {
      this.svgIcon.attr(
        "xlink:href",
        `#icon-${this.getSensorType(this.selector)}`
      );
    }
    const sensorPoint = this.calcOffsetWall();

    if (!this.cableOnly) {
      // this.svgIcon.attr(
      //   "transform",
      //   `translate(${sensorPoint[0]}, ${sensorPoint[1]}) scale(${
      //     this.show(floor) ? 1 / 100 : 1 / 10000
      //   })`
      // );

      this.svgIcon
        .attr("x", `${sensorPoint[0]}px`)
        .attr("y", `${sensorPoint[1]}px`);
      // console.log(this.svgIcon);

      this.setClass(this.svgG);
      this.setClass(this.svg);
    }

    if (this.showBadge) {
      this.badge(sensorPoint);
    } else {
      // if (this.selector === "L0-West-EastWall-light-switch-1")
      //   console.log(2, this);
      if (this.svgBadgeCircle) this.svgBadgeCircle.attr("r", 0);
      if (this.svgBadgeText) this.svgBadgeText.text(``);
    }

    if (!this.sensorOnly) {
      this.svg
        .attr("points", this.cablePoints(sensorPoint, floor).join(" "))
        .attr("transform", this.transform);
      this.setClass(this.svg);
      this.cableLength = this.getLength();
    }
  }

  redraw(floor: Floor) {
    if (!this.show(floor)) {
      return;
    }
    if (this.svgBadge) {
      this.svgBadge
        .attr("stroke-width", this.meterPerPixel * this.lineThickness * 1)
        .attr(
          "transform",
          `translate(${this.meterPerPixel * 10} ${this.meterPerPixel * -10})`
        );
      this.svgBadgeCircle.attr("r", this.meterPerPixel * 8);

      this.svgBadgeText
        .attr("font-size", this.meterPerPixel * this.fontSize)
        .text(`${this.amount}`);
    }
    if (this.svg) {
      this.svg.attr(
        "stroke-width",
        this.meterPerPixel * this.lineThickness * 1
      );
      if (this.cableType === CableType.OutsidePOE)
        this.svg.attr(
          "stroke-dasharray",
          `${this.meterPerPixel * this.lineThickness * 10 * 0.5} ${
            this.meterPerPixel * this.lineThickness * 10
          }`
        );
    }
  }

  cablePoints(sensorPoint: number[], floor: Floor): number[][] {
    return this.show(floor) ? [sensorPoint, ...this.points] : [];
  }

  getLength() {
    const dist = (p1, p2) => Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    let length = 0;

    this.points.forEach((p, i, arr) => {
      if (i + 1 === this.points.length) return;
      length += dist(p, arr[i + 1]);
    });
    return round(length + this.verticalCableLength + this.amount * 0.3);
  }

  badge(coords: xy) {
    this.svgBadge.attr("class", "sensor-badge");

    this.svgBadgeCircle
      .attr("fill", this.amount === 2 ? "white" : "#333")
      .attr("cx", coords[0])
      .attr("cy", coords[1])
      .attr("stroke", "black");

    this.svgBadgeText
      .attr("fill", this.amount === 2 ? "black" : "white")
      .attr("x", coords[0])
      .attr("y", coords[1])
      .attr("text-anchor", "middle")
      .attr("class", "sensor-badge-text")
      .attr("stroke", "none")
      .attr("dominant-baseline", "middle")
      .text(`${this.amount}`);
  }

  calcOffsetWall(): xy {
    if (this.parent instanceof Wall) {
      const wall = this.parent as Wall;

      const arr = wall.sides[this.wallSide];
      const angle = angleBetween(arr[0], arr[1]);
      return angleXY(angle + 90, this.offsetWall, this.points[0]);
    } else {
      return [
        this.points[0][0] + this.offset[0],
        this.points[0][1] + this.offset[1],
      ];
    }
  }

  tooltip = (): SafeHtml => {
    // const [all, type, subtype, level, roomCode, side] =
    //   /.(\w+)-(\w+)-(\d)-(\w+)-(\w+)/gi.exec(this.selector); // sensor-socket-0-f-n-2

    let text = `<b>${this.sensorType.toTitleCase()} `;
    // ${this.}-${side}</b> (+${level})`

    if (this.cableLength > 0) {
      text += `<br>Cable length ${round(this.cableLength, 1)}m2`;
    }
    if (this.group) {
      text += `<br>Group ${this.group}`;
    }

    return text;
  };

  select() {
    document.querySelectorAll("svg .selected").forEach((d, i) => {
      d.classList.remove("selected");
    });

    if ([SensorType.socket, SensorType.perilex].includes(this.sensorType)) {
      document.querySelectorAll(`.el-group-${this.group}`).forEach((d, i) => {
        d.classList.add("selected");
      });
    } else {
      this.svg.node().classList.add("selected");
      this.svgIcon.node().classList.add("selected");
    }
  }
}
