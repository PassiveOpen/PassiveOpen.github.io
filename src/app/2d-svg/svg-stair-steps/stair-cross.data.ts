import { Floor } from "src/app/components/enum.data";
import { Other } from "src/app/house-parts/other.model";
import {
  Elevation,
  RoofPoint,
  RoofStyle,
  RoofType,
} from "src/app/house/cross.model";
import { House, HousePart } from "src/app/house/house.model";
import { PolylineSVG } from "src/app/house-parts/svg-other/polyline.svg";
import { PolygonSVG } from "src/app/house-parts/svg-other/polygon.svg";
import { PathSVG } from "src/app/house-parts/svg-other/path.svg";
import { Measure } from "src/app/house-parts/measure.model";
import { angleBetween, angleXY } from "src/app/shared/global-functions";
import { HousePartModel } from "src/app/house-parts/model/housePart.model";
import { CircleSVG } from "src/app/house-parts/svg-other/circle.svg";

const buildingParts = [
  new Other({
    housePart: HousePart.stairCrossBuilding,
    type: "polygon",
    selector: "floor-groundfloor",
    floor: Floor.all,
    parent: this,

    onUpdate: function (this: Other<any>, house: House) {
      const stair = (house.stair = house.stair);
      this.coords = [
        [-stair.run, stair.groundFloorTop],
        [10, stair.groundFloorTop],
        [10, stair.groundFloorTop + stair.floorThickness],
        [-stair.run, stair.groundFloorTop + stair.floorThickness],
      ];
    },
  }),
  new Other({
    housePart: HousePart.stairCrossBuilding,
    type: "polygon",
    selector: "floor-topfloor-shadow",
    floor: Floor.all,
    parent: this,
    onUpdate: function (this: Other<any>, house: House) {
      const stair = house.stair;
      this.coords = [
        [stair.totalRun, -stair.topFloorTop],
        [-stair.run, -stair.topFloorTop],
        [-stair.run, -(stair.topFloorTop - stair.floorThickness)],
        [stair.totalRun, -(stair.topFloorTop - stair.floorThickness)],
      ];
    },
  }),
  new Other({
    housePart: HousePart.stairCrossBuilding,
    type: "polygon",
    selector: "floor-topfloor",
    floor: Floor.all,
    parent: this,
    onUpdate: function (this: Other<any>, house: House) {
      const stair = house.stair;
      this.coords = [
        [stair.totalRun, -stair.topFloorTop],
        [10, -stair.topFloorTop],
        [10, -(stair.topFloorTop - stair.floorThickness)],
        [stair.totalRun, -(stair.topFloorTop - stair.floorThickness)],
      ];
    },
  }),
  new Other<PathSVG>({
    housePart: HousePart.stairCrossBuilding,
    type: "path",
    selector: "nose-line",
    floor: Floor.all,
    parent: this,
    dataSVG: {},
    onUpdate: function (this: Other<PathSVG>, house: House) {
      const stair = house.stair;
      this.dataSVG.d = `M0 0 L${stair.totalRun} ${-stair.totalRise} `;
      this.applyDataSVG();
    },
  }),
  new Other<PathSVG>({
    housePart: HousePart.stairCrossBuilding,
    type: "path",
    selector: "back-line",
    floor: Floor.all,
    parent: this,
    dataSVG: {},
    onUpdate: function (this: Other<PathSVG>, house: House) {
      const stair = house.stair;
      const pushOff = stair.run * 1 + 0.2;
      this.dataSVG.d = `M${pushOff} 0 L${angleXY(
        -stair.angle,
        -stair.run / Math.tan((stair.angle * Math.PI) / 180),
        [stair.totalRun + pushOff, -stair.totalRise]
      )}`;
      this.applyDataSVG();
    },
  }),
];

const createMeasures = [
  new Measure({
    housePart: HousePart.stairCrossBuilding,
    selector: "run-size",
    floor: Floor.all,
    direction: -90,
    decimals: 3,
    onUpdate: function (this: Measure, house: House) {
      const stair = house.stair;
      this.offsetPixels = 0;
      this.offsetMeters = stair.rise * 1;

      this.a = [stair.run * 7, -stair.rise * 7];
      this.b = [stair.run * 8, -stair.rise * 8];
    },
  }),
  new Measure({
    housePart: HousePart.stairCrossBuilding,
    selector: "rise-size",
    floor: Floor.all,
    direction: 180,
    offsetPixels: 0.5,
    decimals: 3,
    onUpdate: function (this: Measure, house: House) {
      const stair = house.stair;
      this.offsetPixels = 0;
      this.offsetMeters = stair.run * 1;

      this.a = [stair.run * 7, -stair.rise * 7];
      this.b = [stair.run * 8, -stair.rise * 8];
    },
  }),
  new Measure({
    housePart: HousePart.stairCrossBuilding,
    selector: "total-rise-size",
    floor: Floor.all,
    direction: 0,
    offsetPixels: 0,
    onUpdate: function (this: Measure, house: House) {
      const stair = house.stair;
      const pushOff = stair.totalRun + stair.run * 2;
      this.offsetPixels = 0;
      this.offsetMeters = 0;

      this.a = [pushOff, 0];
      this.b = [pushOff, -stair.totalRise];
    },
  }),
  new Measure({
    housePart: HousePart.stairCrossBuilding,
    selector: "total-run-size",
    floor: Floor.all,
    direction: 90,
    onUpdate: function (this: Measure, house: House) {
      const stair = house.stair;
      this.offsetPixels = 16;
      this.offsetMeters = 0;

      this.a = [0, 0];
      this.b = [stair.totalRun, 0];
    },
  }),
];

export const stepsCrossBuildingParts: HousePartModel[] = [
  ...buildingParts,
  ...createMeasures,
].filter((x) => x);
