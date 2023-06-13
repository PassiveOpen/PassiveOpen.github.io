import { House, HousePart, SvgUpdate } from "../../house/house.model";
import * as d3 from "d3";
import { Cross } from "../../house/cross.model";
import { SafeHtml } from "@angular/platform-browser";
import { Floor } from "../../components/enum.data";
import { Stair } from "../../house/stairs.model";
import { Wall } from "../wall.model";
import { Sensor } from "../sensor.model";
import { WallSVG } from "../svg/wall.svg";

let ids = {};

// export class
export abstract class HousePartModel<T extends HousePartSVG = any> {
  floor: Floor;
  name: string;
  parts: any[];
  selector: string;
  outOfDesign: Boolean;
  parent: any;

  svg?: T;

  abstract housePart: HousePart;

  abstract onUpdate(house: House): void;
  abstract afterUpdate(): void;
  abstract getSVGInstance(): void;

  setVisibility(visibility: boolean) {
    if (this.svg) this.svg.visible = visibility;
  }
}

export abstract class HousePartSVG<T extends HousePartModel<any> = any> {
  floor: Floor; // no default, block inheritance
  transform: string;
  selector: string;
  name;
  parts: any[];
  svg: d3.Selection<SVGGElement, unknown, HTMLElement, undefined>;
  model: T;
  center;
  meterPerPixel: number;
  classes: string[];
  index = 0;
  visible = false;
  theoretic = false;
  loaded = false;
  svgUpdate: SvgUpdate;

  _IsRendered;
  _lineThickness = 1;
  get lineThickness(): number {
    return this._lineThickness;
  }
  set lineThickness(x: number) {
    this._lineThickness = x;
  }

  constructor(model: T) {
    this.model = model;
    this.selector = model.selector;
    this.floor = model.floor;
  }

  /** This links the instance with the SVG via D3 */
  abstract setD3(): void;
  /** If the svg should not be rendered, thus invisible */
  abstract drawWhenNotVisible(): void;
  /** This draws the svg for the first time */
  abstract initDraw(): void;
  /** This updates the svg after a zoom */
  abstract updateScale(): void;

  /** This allows the model to be calculated */
  onUpdate: (house: any) => void;
  afterUpdate: () => void;

  tooltip = (x: T | Wall): SafeHtml => {
    return `<b>${this.name ? this.name : this.selector}</b>`;
  };

  show(floor: Floor): boolean {
    const floorActive = this.floor === floor || this.floor === Floor.all;
    this._IsRendered = floorActive && this.visible && !this.model.outOfDesign;
    return this._IsRendered;
  }

  update(svgUpdate: SvgUpdate) {
    this.svgUpdate = svgUpdate;

    if (this.svg === undefined) this.setD3();
    const activeFloor = this.svgUpdate.floor;
    this.meterPerPixel = this.svgUpdate.meterPerPixel;

    if (!this.show(activeFloor)) {
      this.drawWhenNotVisible();
      return;
    }

    if (this.svg === undefined || this.svgUpdate.redrawAll === true) {
      this.initDraw();
      this.setClass(this.svg);
    }

    this.updateScale();
  }

  select() {
    document.querySelectorAll("svg .selected").forEach((d, i) => {
      d.classList.remove("selected");
    });
    this.svg.node().classList.add("selected");
  }

  setClass(svg) {
    if (!svg.node() || !this.classes) {
      return;
    }

    this.classes.forEach((c) => {
      svg.node().classList.add(c);
    });
  }
}
