import { House, HousePart, SvgUpdate } from "../../house/house.model";
import * as d3 from "d3";
import { Cross } from "../../house/cross.model";
import { SafeHtml } from "@angular/platform-browser";
import { Floor } from "../../components/enum.data";
import { Stair } from "../../house/stairs.model";
import { Wall } from "../wall.model";
import { Sensor } from "../../model/specific/sensors/sensor.model";
import { WallSVG } from "../svg/wall.svg";

let ids = {};

// export class
export abstract class HousePartModel<T = House> {
  floor: Floor;
  name: string;
  parts: any[];
  selector: string;
  outOfDesign: Boolean;

  svg?: HousePartSVG;

  abstract housePart: HousePart;

  abstract onUpdate(house: T): void;
  abstract afterUpdate(): void;
  abstract getSVGInstance(): void;

  setVisibility(visibility: boolean) {
    if (this.svg) this.svg.visible = visibility;
  }
}

export abstract class HousePartSVG<T extends HousePartModel = any> {
  floor: Floor; // no default, block inheritance
  name;
  parts: any[];
  svg: d3.Selection<SVGGElement, unknown, HTMLElement, undefined>;
  classes: string[] = [];
  model: T;
  center;
  transform: string = "";
  meterPerPixel: number;
  selector: string = "";
  index = 0;
  visible = false;
  outOfDesign = false;
  theoretic = false;
  loaded = false;
  svgUpdate: SvgUpdate;

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
    return floorActive && this.visible && !this.outOfDesign; //&& !this.theoretic
  }

  update(svgUpdate: SvgUpdate) {
    this.svgUpdate = svgUpdate;

    if (this.svg === undefined) this.setD3();
    const activeFloor = this.svgUpdate.floor;
    this.meterPerPixel = this.svgUpdate.meterPerPixel;

    // if (this.model.housePart === HousePart.walls) {
    //   //@ts-ignore
    //   const wall = this.model as Wall;
    // }
    if (this.svgUpdate.redrawAll === true) {
      if (!this.show(activeFloor)) {
        this.drawWhenNotVisible();
        return;
      }

      this.initDraw(); // This draws all for the first time
    }

    if (this.show(activeFloor)) {
      this.updateScale(); // this updates all the sizes after a zoom.
    }
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
