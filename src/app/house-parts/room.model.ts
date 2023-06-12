import { polygonArea } from "d3";
import { offset, round } from "src/app/shared/global-functions";
import { Floor } from "../components/enum.data";
import { House, HousePart, xy } from "../house/house.model";
import { HousePartModel } from "./model/housePart.model";
import { RoomSVG } from "./svg/room.svg";

export class Room<T = House> extends HousePartModel {
  housePart = HousePart.rooms;

  coords: xy[] = [];
  parent: House;
  hole = false;
  centralElectricity: xy = [0, 0];
  theoretic = false;
  function: string;
  northWestCorner: xy;
  width = 0;
  height = 0;
  center;

  constructor(data: Partial<Room>) {
    super();
    Object.assign(this, data);
  }

  onUpdate(house: House) {} // in user data
  afterUpdate(): void {
    this.selector = `room-${this.name}`;
  }

  getSVGInstance() {
    this.svg = new RoomSVG(this);
  }

  setup(): void {}

  area = () => {
    if (this.coords.length === 0 || this.hole) {
      return 0;
    }
    return Math.abs(round(polygonArea(this.coords), 1));
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
}
