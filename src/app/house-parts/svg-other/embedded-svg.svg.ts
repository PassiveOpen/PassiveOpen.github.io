import * as d3 from "d3";
import { HousePartSVG } from "../model/housePart.model";
import { Other } from "../other.model";
import { xy } from "src/app/house/house.model";

export class EmbeddedSVG extends HousePartSVG<Other<EmbeddedSVG>> {
  url = "assets/svg/";
  type = "svg";
  filename;
  rotation;
  anchor: xy;
  scale: xy;
  scaler = 1;

  setD3() {
    this.svg = d3.select(`#${this.selector}`);
    this.loader();
    this.classes = ["svg-loader"];
    if (this.scaler === undefined) this.scaler = 1;
    if (this.scale === undefined) this.scale = [1, 1];
    if (this.rotation === undefined) this.rotation = 0;
    if (this.anchor === undefined) this.anchor = [0, 0];
    this.lineThickness = 0.1;
  }

  drawWhenNotVisible() {
    this.svg.attr("visibility", "hidden");
  }

  initDraw() {
    this.transform = `translate(${this.anchor[0]},${this.anchor[1]}) rotate(${this.rotation}) scale(${this.scale[0]},${this.scale[1]})`;
    this.svg.attr("transform", this.transform);
    this.svg.attr("visibility", "visible");
  }

  updateScale() {
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
    this.updateScale();
  }
}
