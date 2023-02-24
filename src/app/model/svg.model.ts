import * as d3 from "d3";
import { Floor } from "../components/enum.data";
import { xy } from "../house/house.model";
import { BaseSVG } from "./base.model";

export class AppSVG extends BaseSVG {
  url = "assets/svg/";
  filename = "dude.svg";
  anchor: xy = [0, 0];
  rotation: number = 0;

  scaler = 1;
  scale: [number, number] = [1, 1];

  constructor(data: Partial<AppSVG>) {
    super();
    this.lineThickness = 0.1;
    Object.assign(this, data);
  }

  async draw(floor: Floor) {
    if (this.svg === undefined) {
      if (!this.show(floor)) return;
      await this.loader();
    }
    if (!this.show(floor)) {
      this.svg.attr("visibility", "hidden");
      return;
    }

    this.transform = `translate(${this.anchor[0]},${this.anchor[1]}) rotate(${this.rotation}) scale(${this.scale[0]},${this.scale[1]})`;

    this.svg.attr("transform", this.transform);
    this.svg.attr("visibility", "visible");
    this.setClass(this.svg);
  }

  redraw(floor: Floor) {
    if (!this.show(floor)) {
      return;
    }
    if (this.svg) {
      this.svg
        .node()
        .querySelectorAll(
          "path, rect, circle, ellipse, line, polyline, polygon"
        )
        .forEach((x: HTMLElement) => {
          x.style.strokeWidth = `${
            this.scaler * this.meterPerPixel * this.lineThickness
          }px`;
        });
    }
  }

  async loader() {
    const svg = await fetch(`${this.url}${this.filename}`).then((r) =>
      r.text()
    );
    this.svg = d3.select(`#${this.selector}`);

    this.classes.push(`svg-${this.filename.split(".")[0]}`);

    const regH = /height="([0-9]+)[.]?\d*px"/gi;
    const regW = /width="([0-9]+)[.]?\d*px"/gi;
    const h = Number(regH.exec(svg)[1]);
    const w = Number(regW.exec(svg)[1]);
    this.svg.html(
      svg
        .replace(regH, `height="${h / 1000}px"`)
        .replace(regW, `width="${w / 1000}px"`)
    );
    this.scaler = h;
  }
}
