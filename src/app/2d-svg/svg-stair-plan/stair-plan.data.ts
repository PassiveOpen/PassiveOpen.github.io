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
  new Measure({
    housePart: HousePart.measures,
    selector: "plateau-width",
    floor: Floor.all,
    direction: -90,
    onUpdate: function (this: Measure, house: House) {
      const stair = house.stair;
      const pushOff = stair.stairOrigin[1] - 0.5;
      this.offsetPixels = 0;
      this.offsetMeters = 0;

      this.a = [stair.stairOrigin[0] + 0, pushOff];
      this.b = [stair.stairOrigin[0] + stair.walkWidth, pushOff];
    },
  }),
  new Measure({
    housePart: HousePart.measures,
    selector: "mid-width",
    floor: Floor.all,
    direction: -90,
    onUpdate: function (this: Measure, house: House) {
      const stair = house.stair;
      const pushOff = stair.stairOrigin[1] - 0.5;
      this.offsetPixels = 0;
      this.offsetMeters = 0;

      this.a = [stair.stairOrigin[0] + stair.walkWidth, pushOff];
      this.b = [
        stair.stairOrigin[0] + stair.totalWidth - stair.walkWidth,
        pushOff,
      ];
    },
  }),
  new Measure({
    housePart: HousePart.measures,
    selector: "total-width",
    floor: Floor.all,
    direction: -90,
    onUpdate: function (this: Measure, house: House) {
      const stair = house.stair;
      const pushOff = stair.stairOrigin[1] - 0.5;
      this.offsetPixels = 16;
      this.offsetMeters = 0;

      this.a = [stair.stairOrigin[0], pushOff];
      this.b = [stair.stairOrigin[0] + stair.totalWidth, pushOff];
    },
  }),
  new Measure({
    housePart: HousePart.measures,
    selector: "total-height",
    floor: Floor.all,
    direction: 0,
    onUpdate: function (this: Measure, house: House) {
      const stair = house.stair;
      const pushOff = stair.stairOrigin[0] + stair.totalWidth + 0.5;
      this.offsetPixels = 16;
      this.offsetMeters = 0;

      this.b = [pushOff, stair.stairOrigin[1]];
      this.a = [pushOff, stair.stairOrigin[1] + stair.totalHeight];
    },
  }),
  new Measure({
    housePart: HousePart.measures,
    selector: "lesser-height",
    floor: Floor.all,
    direction: 0,
    onUpdate: function (this: Measure, house: House) {
      const stair = house.stair;
      const pushOff = stair.stairOrigin[0] + stair.totalWidth + 0.5;
      this.offsetPixels = 0;
      this.offsetMeters = 0;

      this.b = [pushOff, stair.stairOrigin[1]];
      this.a = [pushOff, stair.stairOrigin[1] + stair.lesserHeight];
    },
  }),
];

export const stepsCrossBuildingParts: HousePartModel[] = [
  new Other<PolygonSVG>({
    selector: "clip-ground-floor-ref",
    floor: Floor.ground,
    type: "polygon",
    housePart: HousePart.stairPlan,
    onUpdate: function (this: Other<PolygonSVG>, house: House) {
      const stair = house.stair;
      const [x, y] = stair.stairOrigin;
      const dx1 = x + stair.walkWidth;
      const dx2 = x + stair.totalWidth - stair.walkWidth;
      const dy1 = Math.max(stair.alongWalkLine(1)[1], y + stair.walkWidth);
      const dy2 = Math.max(
        stair.alongWalkLine(stair.steps)[1],
        y + stair.walkWidth
      );
      this.coords = [
        [x, y],
        [dx2, y],
        [dx2, y + stair.walkWidth],
        [dx1, y + stair.walkWidth],
        [dx1, dy1],
        [x, dy1],
      ];
    },
  }),

  new Other<PolygonSVG>({
    selector: "clip-roof-ref",
    floor: Floor.ground,
    type: "polygon",
    housePart: HousePart.stairPlan,
    onUpdate: function (this: Other<PolygonSVG>, house: House) {
      const stair = house.stair;
      const [x, y] = stair.stairOrigin;
      const dx1 = x + stair.walkWidth;
      const dx2 = x + stair.totalWidth - stair.walkWidth;
      const dy1 = Math.max(stair.alongWalkLine(1)[1], y + stair.walkWidth);
      const dy2 = Math.max(
        stair.alongWalkLine(stair.steps)[1],
        y + stair.walkWidth
      );
      this.coords = [
        [x, y],
        [x + stair.totalWidth, y],
        [x + stair.totalWidth, dy2],
        [dx2, dy2],
        [dx2, y + stair.walkWidth],
        [dx1, y + stair.walkWidth],
        [dx1, dy1],
        [x, dy1],
      ];
    },
  }),
  // //
  // //
  // //     onUpdate: function (this: Other<PolygonSVG>, house:House){

  // //   })
  // // );

  new Other<PolygonSVG>({
    type: "polygon",
    selector: "outline",
    floor: Floor.all,
    parent: this,
    housePart: HousePart.stairPlan,
    onUpdate: function (this: Other<PolygonSVG>, house: House) {
      const stair = house.stair;
      this.coords = [
        stair.stringers.out.coords[0],
        stair.stringers.out.coords[1],
        stair.stringers.out.coords[2],
        stair.stringers.out.coords[3],
        stair.stringers.in.coords[3],
        stair.stringers.in.coords[2],
        stair.stringers.in.coords[1],
        stair.stringers.in.coords[0],
      ];
    },
  }),

  new Other<PathSVG>({
    type: "path",
    selector: "walk-line",
    floor: Floor.all,
    parent: this,
    housePart: HousePart.stairWalkLine,
    onUpdate: function (this: Other<PathSVG>, house: House) {
      const stair = house.stair;
      // /        a0.6,0.6 0 0 1 0.6,-0.4
      const rest = stair.walkWidth - stair.walkLineOffset;
      const right = stair.alongWalkLine(stair.steps);
      const left = stair.alongWalkLine(1);
      this.dataSVG.d = `
        M${left[0]} ${left[1]}
        L${left[0]} ${stair.stairOrigin[1] + stair.walkWidth}
        a${stair.walkLineOffset},${stair.walkLineOffset} 0 0 1 ${
        stair.walkLineOffset
      },${-stair.walkLineOffset}
        L${stair.stairOrigin[0] + stair.walkWidth} ${
        stair.stairOrigin[1] + rest
      }
        L${stair.stairOrigin[0] + stair.totalWidth - stair.walkWidth} ${
        stair.stairOrigin[1] + rest
      }
        a${stair.walkLineOffset},${stair.walkLineOffset} 0 0 1 ${
        stair.walkLineOffset
      },${stair.walkLineOffset}
        L${right[0]} ${right[1]}
        `;
      this.applyDataSVG();
    },
  }),
  ...createMeasures,
].filter((x) => x);
