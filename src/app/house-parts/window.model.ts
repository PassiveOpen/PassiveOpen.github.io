import { SafeHtml } from "@angular/platform-browser";
import * as d3 from "d3";
import { House, HousePart } from "../house/house.model";
import { Cross } from "../house/cross.model";
import { Wall } from "./wall.model";
import { BaseSVG } from "../model/base.model";
import { Floor } from "../components/enum.data";
import { HousePartModel } from "./model/housePart.model";
import { WindowSVG } from "./svg/window.svg";

export enum WindowForm {
  windowWall = "windowWall",
  standard = "standard",
  hexagon = "hexagon",
}

let ids = 0;

export class Window<T = House> extends HousePartModel {
  housePart = HousePart.windows;
  floor = Floor.ground;
  windowForm = WindowForm.standard;
  parent: Wall;
  width = 2;
  height = 2;
  elevation = 0.9;
  origin = [0, 0];
  scale = [1, 1];
  rotate = 0;
  frameThickness = 0.1;
  frameDepth = 0.1;
  innerDepthFrame = 0.1;
  openable = true;

  get outerDepthFrame() {
    return this.innerDepthFrame + this.frameDepth;
  }

  constructor(data: Partial<Window<T>>) {
    super();
    Object.assign(this, data);
  }

  onUpdate(house: House) {} // in user data

  afterUpdate(): void {
    ids++;
    this.selector = `${this.parent.selector}-window-${ids}`;
  }

  getSVGInstance() {
    this.svg = new WindowSVG(this);
  }
}
