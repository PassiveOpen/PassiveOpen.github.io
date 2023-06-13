import { Floor } from "../components/enum.data";
import { House, HousePart, xy } from "../house/house.model";
import { HousePartModel } from "./model/housePart.model";
import { MeasureSVG } from "./svg/measure.svg";

export const createMeasures = (house: House) => {
  return [
    ...[0, 1, 2].map((i) => {
      const letters = ["a", "b", "c", "d"];
      return new Measure({
        selector: "house-width-" + (i + 1),
        floor: Floor.all,
        direction: 90,
        textRotate: 0,
        onUpdate: function (this: Measure, house: House) {
          const pushOff = house.houseLength + house.studDistance * 2;
          this.offsetPixels = 0;
          this.a = [house.stramien.out.we[letters[i + 0]], pushOff];
          this.b = [house.stramien.out.we[letters[i + 1]], pushOff];
        },
      });
    }),

    new Measure({
      selector: "house-total-width",
      floor: Floor.all,
      direction: 90,
      textRotate: 0,
      onUpdate: function (this: Measure, house: House) {
        const pushOff = house.houseLength + house.studDistance * 2;
        this.offsetPixels = 16;
        this.a = [house.stramien.out.we.a, pushOff];
        this.b = [house.stramien.out.we.d, pushOff];
      },
    }),
    new Measure({
      selector: "house-height-1",
      floor: Floor.all,
      direction: 0,
      textRotate: 0,
      onUpdate: function (this: Measure, house: House) {
        const pushOff = house.houseWidth + house.studDistance * 1;
        this.offsetPixels = 8;
        this.offsetMeters = house.studDistance;
        this.b = [pushOff, house.stramien.out.ns.a];
        this.a = [pushOff, house.stramien.out.ns.b];
      },
    }),
    new Measure({
      selector: "house-height-inner",
      floor: Floor.all,
      direction: 180,
      textRotate: 0,
      onUpdate: function (this: Measure, house: House) {
        const pushOff = -house.studDistance * 1;
        this.offsetPixels = 8;
        this.offsetMeters = house.studDistance;
        this.b = [pushOff, house.stramien.in.ns.b];
        this.a = [pushOff, house.stramien.in.ns.c];
      },
    }),
    new Measure({
      selector: "house-height-2",
      floor: Floor.all,
      direction: 0,
      textRotate: 0,
      onUpdate: function (this: Measure, house: House) {
        const pushOff = house.houseWidth + house.studDistance * 1;
        this.offsetPixels = 8;
        this.offsetMeters = house.studDistance;
        this.b = [pushOff, house.stramien.out.ns.b];
        this.a = [pushOff, house.stramien.out.ns.c];
      },
    }),
    new Measure({
      selector: "house-height-3",
      floor: Floor.all,
      direction: 0,
      textRotate: 0,
      onUpdate: function (this: Measure, house: House) {
        const pushOff = house.houseWidth + house.studDistance * 1;
        this.offsetPixels = 8;
        this.offsetMeters = house.studDistance;
        this.b = [pushOff, house.stramien.out.ns.c];
        this.a = [pushOff, house.stramien.out.ns.d];
      },
    }),
    new Measure({
      selector: "house-total-height",
      floor: Floor.all,
      direction: 0,
      textRotate: 0,
      onUpdate: function (this: Measure, house: House) {
        const pushOff = house.houseWidth + house.studDistance * 1;
        this.offsetPixels = 32;
        this.offsetMeters = house.studDistance;
        this.b = [pushOff, house.stramien.out.ns.a];
        this.a = [pushOff, house.stramien.out.ns.d];
      },
    }),
  ];
};

export class Measure extends HousePartModel {
  housePart: HousePart = HousePart.measures;
  a: xy = [0, 0];
  b: xy = [4, 4];
  offsetPixels = 0;
  offsetMeters = 0;
  direction = 90;

  decimals = 1;
  textRotate: number;

  constructor(data: Partial<Measure>) {
    super();
    Object.assign(this, data);
  }

  onUpdate(t: any) {} // in user data
  afterUpdate(): void {
    this.selector = `measure${this.selector ? "-" + this.selector : ""}${
      this.name ? "-" + this.name : ""
    }`;
  }
  getSVGInstance() {
    this.svg = new MeasureSVG(this);
  }

  between(a, b) {
    return [a[0] + (b[0] - a[0]) / 2, a[1] + (b[1] - a[1]) / 2];
  }
}
