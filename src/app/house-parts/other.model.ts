import { polygonArea } from "d3";
import { offset, round } from "src/app/shared/global-functions";
import { Floor } from "../components/enum.data";
import { House, HousePart, xy } from "../house/house.model";
import { HousePartModel } from "./model/housePart.model";
import { RoomSVG } from "./svg/room.svg";
import { PolylineSVG } from "./svg/polyline.model";
import { PolygonSVG } from "./svg/polygon.model";

export interface PolylineSVGData {
  type: "polyline";
  lineThickness?: number;
  dash?: number[];
}
export interface PolygonSVGData {
  type: "polygon";
}

export class Other<T = House> extends HousePartModel {
  housePart = HousePart.otherPolygons;
  coords: xy[] = [];

  dataSVG: PolylineSVGData | PolygonSVGData;

  constructor(data: Partial<Other>) {
    super();
    Object.assign(this, data);
  }

  setup(): void {}
  onUpdate(house: House) {} // in user data
  afterUpdate(): void {
    if (this.selector === undefined)
      throw new Error(`Selector is undefined, ${this.dataSVG?.type}}`);
  }

  getSVGInstance() {
    if (this.dataSVG.type === "polyline") this.svg = new PolylineSVG(this);
    if (this.dataSVG.type === "polygon") this.svg = new PolygonSVG(this);

    Object.assign(this.svg, this.dataSVG);
  }

  square(w: number, h: number, origin: xy) {
    this.coords = [
      [origin[0], origin[1]],
      [origin[0] + w, origin[1]],
      [origin[0] + w, origin[1] + h],
      [origin[0], origin[1] + h],
    ];
  }
}
