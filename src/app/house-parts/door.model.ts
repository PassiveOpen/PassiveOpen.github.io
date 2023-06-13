import { House, HousePart } from "../house/house.model";
import { DoorSVG } from "./svg/door.svg";
import { HousePartModel, HousePartSVG } from "./model/housePart.model";
import { Wall } from "./wall.model";

let ids = 0;

export class Door extends HousePartModel {
  parent: Wall;
  width = 0.9;
  height = 2.3;
  origin = [0, 0];
  scale = [1, 1];
  rotate = 0;
  outside = false;
  housePart = HousePart.doors;

  constructor(data: Partial<Door>) {
    super();
    Object.assign(this, data);
  }

  onUpdate(house: House) {} // in user data
  afterUpdate(): void {
    ids++;
    this.selector = `${this.parent.selector}-door-${ids}`;
  }

  getSVGInstance() {
    this.svg = new DoorSVG(this);
  }
}
