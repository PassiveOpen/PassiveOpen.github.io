import * as d3 from "d3";
import { CableType } from "src/app/components/enum.data";
import { HousePartSVG } from "../model/housePart.model";
import { Sensor } from "../sensor-models/sensor.model";

export class SensorSVG extends HousePartSVG<Sensor<any>> {
  svgIcon: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  svgBadge: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  svgBadgeCircle: d3.Selection<SVGCircleElement, unknown, HTMLElement, any>;
  svgBadgeText: d3.Selection<SVGTextElement, unknown, HTMLElement, any>;
  svgCable: d3.Selection<SVGPolylineElement, unknown, HTMLElement, any>;

  afterD3() {}
  setD3(): void {
    this.classes = ["sensor"];
    this.svg = d3.select(`#${this.selector}`);

    this.svgCable = this.svg.append("polyline").attr("class", "sensor-cable");
    // So it has a Icon
    if (!this.model.cableOnly) {
      this.svgIcon = this.svg.append("use").attr("class", `sensor-icon`);
      if (this.model.showBadge) {
        this.svgBadge = this.svg.append("g");
        this.svgBadgeCircle = this.svgBadge
          .append("circle")
          .attr("stroke", "black");
        this.svgBadgeText = this.svgBadge
          .append("text")
          .attr("text-anchor", "middle")
          .attr("class", "sensor-badge-text")
          .attr("stroke", "none")
          .attr("dominant-baseline", "middle");
      }
    } else {
      this.lineThickness = 2;
      this.classes.push("sensor-room-cable");
    }

    if (this.model.group) this.classes.push(`el-group-${this.model.group}`);

    if (this.model.cableType)
      this.classes.push(`cable-${this.model.cableType}`);

    this.classes.push(`${this.model.sensorType}`);
    this.afterD3();
  }

  drawWhenNotVisible(): void {
    this.svgIcon?.attr("href", "");
    this.svgCable?.attr("points", "");
    this.svgBadgeCircle?.attr("r", 0);
    this.svgBadgeText?.attr("font-size", 0);
    this.model.showBadge = false;
  }

  initDraw(): void {
    this.svgIcon?.attr(
      "href",
      `#icon-${this.model.getSensorType(this.selector)}`
    );
    this.svgBadge?.attr("class", "sensor-badge");

    this.svgBadgeCircle
      ?.attr("fill", this.model.amount === 2 ? "white" : "#333")
      .attr("cx", this.model.sensorPoint[0])
      .attr("cy", this.model.sensorPoint[1]);

    this.svgBadgeText
      ?.attr("fill", this.model.amount === 2 ? "black" : "white")
      .attr("x", this.model.sensorPoint[0])
      .attr("y", this.model.sensorPoint[1])
      .text(`${this.model.amount}`);

    this.svgCable?.attr(
      "points",
      [this.model.sensorPoint, ...this.model.coords].join(" ")
    );
  }
  updateScale(): void {
    this.svgIcon?.attr(
      "transform",
      `translate(${this.model.sensorPoint[0]}, ${
        this.model.sensorPoint[1]
      }) scale(${this.meterPerPixel * 40})`
    );
    this.svgBadge
      ?.attr("stroke-width", this.meterPerPixel * this.lineThickness * 1)
      .attr(
        "transform",
        `translate(${this.meterPerPixel * 10} ${this.meterPerPixel * -10})`
      );
    this.svgBadgeCircle?.attr("r", this.meterPerPixel * 8);

    this.svgBadgeText
      ?.attr("font-size", this.meterPerPixel * this.model.fontSize)
      .text(`${this.model.amount}`);

    this.svgCable?.attr(
      "stroke-width",
      this.meterPerPixel * this.lineThickness * 1
    );
    if (this.model.cableType === CableType.OutsidePOE)
      this.svgCable?.attr(
        "stroke-dasharray",
        `${this.meterPerPixel * this.lineThickness * 10 * 0.5} ${
          this.meterPerPixel * this.lineThickness * 10
        }`
      );
  }
}
