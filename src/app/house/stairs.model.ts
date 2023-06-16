import { Cross, Elevation } from "src/app/house/cross.model";
import { House, HousePart, xy } from "src/app/house/house.model";
import { AppPath } from "src/app/model/path.model";
import {
  angleBetween,
  angleXY,
  distanceBetweenPoints,
  findCircleLineIntersections,
  lineIntersect,
  offset,
  round,
} from "src/app/shared/global-functions";
import { Floor } from "../components/enum.data";
import { StairModel } from "../house-parts/stair-plan.model";
import { BaseSVG } from "../model/base.model";
import { AppCircle } from "../model/circle.model";
import { AppPolygon } from "../model/polygon.model";
import { AppStairPlan } from "../model/specific/stair-plan.model";
import { AppStair } from "../model/specific/stair-step.model";
import { CircleSVG } from "../house-parts/svg-other/circle.svg";
import { Other } from "../house-parts/other.model";

export interface Stringer {
  coords: xy[];
}
export interface Stringers {
  in: Stringer;
  out: Stringer;
}
export class Stair {
  house: House;
  cross: Cross;
  // Inputs
  totalRun = 4.6;
  steps = 19;
  runThickness = 0.02;
  riseThickness = 0.02;
  nose = 0.02;
  walkWidth = 0.8;
  walkLineOffset = 0.3;
  totalWidth = 2.7;

  stepsFlightRight = 9;
  stepsFlightLeft = 2;
  stepsFlightMid = 10;

  // Elevation heights
  groundFloorTop = -1;
  topFloorTop = -1;
  topFloorBottom = -1;
  groundElevation = -1;
  ceilingHeight = -1;
  floorThickness = -1;
  totalRise = -1;
  run = -1;
  rise = -1;
  angle;
  maxSteps;
  minSteps;
  optimizedStep;
  stairOrigin: [number, number] = [0, 0];
  totalHeight = -1;
  lesserHeight = -1;

  intersections = {};

  stringers: Stringers;

  parts: BaseSVG[] = [];

  constructor() {}

  create(house: House) {
    this.house = house;
    this.cross = house.cross;
    this.createStep();
  }

  calculate(house) {
    // Determined by other inputs
    this.house = house;
    this.ceilingHeight = this.house.cross.ceilingHeight;
    this.floorThickness = this.house.cross.topFloorThickness;
    this.groundFloorTop = 0;
    this.topFloorTop = this.house.cross.elevations[Elevation.topFloor];
    this.totalRise = this.topFloorTop - this.groundFloorTop;

    // Defined
    this.stairOrigin = [
      this.house.stramien.in.we.b,
      this.house.stramien.in.ns.b - 5,
    ];
    // this.stairOrigin = [0, 0];

    // Calculated
    this.angle = round(
      Math.atan(this.totalRise / this.totalRun) * (180 / Math.PI),
      1
    );

    this.run = round(this.totalRun / this.steps);
    this.rise = round(this.totalRise / this.steps);
    this.optimizedStep = round(this.run * 2 + this.run);
    this.maxSteps = Math.ceil(this.totalRise / 0.182);
    this.minSteps = Math.ceil(this.totalRise / 0.22);

    this.stepsFlightMid = Math.floor(
      (this.totalWidth - this.walkWidth * 2) / this.run
    );

    this.stepsFlightRight =
      this.steps - this.stepsFlightMid - this.stepsFlightLeft;

    const [yLeftSide, yRightSide] = [
      this.alongWalkLine(1)[1] - this.stairOrigin[1],
      this.alongWalkLine(this.steps + 1)[1] - this.stairOrigin[1],
    ].map((x) => Math.max(this.walkWidth, x));

    this.totalHeight = Math.max(yLeftSide, yRightSide);
    this.lesserHeight = Math.min(yLeftSide, yRightSide);
    // this.calculateCorrectionArray();
    const out: Stringer = {
      coords: [
        offset(this.stairOrigin, [this.totalWidth * 0, yLeftSide]),
        offset(this.stairOrigin, [this.totalWidth * 0, 0]),
        offset(this.stairOrigin, [this.totalWidth * 1, 0]),
        offset(this.stairOrigin, [this.totalWidth * 1, yRightSide]),
      ],
    };
    this.stringers = {
      in: {
        coords: [
          offset(out.coords[0], [this.walkWidth * +1, this.walkWidth * +0]),
          offset(out.coords[1], [this.walkWidth * +1, this.walkWidth * +1]),
          offset(out.coords[2], [this.walkWidth * -1, this.walkWidth * +1]),
          offset(out.coords[3], [this.walkWidth * -1, this.walkWidth * +0]),
        ],
      },
      out,
    };
  }

  createStep() {
    return Array(24)
      .fill(0)
      .forEach((_, index) => {
        if (index === 0) return;
        this.house.houseParts.stairPlan.push(
          new StairModel({
            housePart: HousePart.stairPlan,
            selector: `step-${index}`,
            parent: this,
            index: index,
            onUpdate: function (this: StairModel, house: House) {
              const stair = house.stair;
              this.outOfDesign = !(index < stair.steps + 1);
              this.last = index === stair.steps;
              this.stringers = stair.stringers;
              this.walkLineXY = stair.alongWalkLine(index);
              this.nextWalkLineXY = stair.alongWalkLine(index + 1);
              this.stringerXY = stair.alongStinger(index);
              this.nextStingerXY = stair.alongStinger(index + 1);
            },
          })
        );
        this.house.houseParts.stairDebug.push(
          ...[
            new Other<CircleSVG>({
              type: "circle",
              housePart: HousePart.stairDebug,
              floor: Floor.all,
              selector: "walk-line-" + index,
              parent: this,
              dataSVG: {
                lineThickness: 1,
                classes: ["walk-line-dot"],
              },
              onUpdate: function (this: Other<CircleSVG>, house: House) {
                const stair = house.stair;
                this.outOfDesign = !(index < stair.steps + 1);
                this.dataSVG.r = this.svg?.meterPerPixel * 2;
                [this.dataSVG.cx, this.dataSVG.cy] = stair.alongWalkLine(index);
                this.applyDataSVG();
              },
            }),
            new Other<CircleSVG>({
              type: "circle",
              housePart: HousePart.stairDebug,
              floor: Floor.all,
              selector: "step-stinger-" + index,
              parent: this,
              dataSVG: {
                lineThickness: 1,
                classes: ["step-stinger"],
              },
              onUpdate: function (this: Other<CircleSVG>, house: House) {
                const stair = house.stair;
                this.outOfDesign = !(index < stair.steps + 1);
                this.dataSVG.r = this.svg?.meterPerPixel * 2;
                [this.dataSVG.cx, this.dataSVG.cy] = stair.alongStinger(index);
                this.applyDataSVG();
              },
            }),
          ]
        );
      });
  }

  calculateCorrectionArray() {
    const quart = (this.walkLineOffset * Math.PI) / 2;
    const half = (this.totalWidth - this.walkWidth * 2) / 2;
    const lengthRight = (this.stepsFlightRight + 1) * this.run;
    const lengthLeft = this.totalRun - lengthRight;
    const leftSide = lengthLeft - quart - half;
    const rightSide = lengthRight - quart - half;

    this.intersections = {};

    // /////// lowerLeft
    const lowerLeftSteps = this.getEGMethod(
      leftSide + quart / 2,
      this.alongWalkLine(0)[1] - (this.stairOrigin[1] + this.walkWidth),
      0,
      0,
      false
    );

    // // /////// higherLeft;
    const higherLeftSteps = this.getEGMethod(
      half + quart / 2,
      this.totalWidth / 2 - this.walkWidth,
      lowerLeftSteps,
      0,
      true
    );
    /////// higherRight
    const higherRightSteps = this.getEGMethod(
      half + quart / 2,
      this.totalWidth / 2 - this.walkWidth,
      lowerLeftSteps + higherLeftSteps,
      0,
      false
    );
    // /////// lowerRight
    const lowerRightSteps = this.getEGMethod(
      rightSide + quart / 2,
      this.alongWalkLine(this.steps)[1] -
        (this.stairOrigin[1] + this.walkWidth),
      lowerLeftSteps + 0 + higherLeftSteps + higherRightSteps,
      0,
      true
    );
  }

  getEGMethod(walkLineLength, stingerLength, offsetStep, skipLength, reversed) {
    let A, M, B, N, S;
    const correctedWalkline = walkLineLength - skipLength;
    const steps = Math.ceil(correctedWalkline / this.run);

    const correctedStinger = stingerLength - skipLength;
    if (reversed) {
      A = [0, 0];
      M = [0, correctedWalkline];
      B = [-correctedStinger, 0];
      N = findCircleLineIntersections(
        correctedStinger,
        -(M[1] / correctedStinger),
        M[1]
      );
      N = [-N[0], N[1]];
    } else {
      A = [0, 0];
      M = [0, correctedWalkline];
      B = [correctedStinger, 0];
      N = findCircleLineIntersections(
        correctedStinger,
        -(M[1] / correctedStinger),
        M[1]
      );
    }
    const intersections = [];
    for (let step = 0; step < steps + 1; step++) {
      if (reversed) {
        S = [0, Math.min(this.run * (steps - step), correctedWalkline)];
      } else {
        S = [0, Math.min(this.run * step, correctedWalkline)];
      }
      const lineAN = [A, N];
      const lineSB = [S, B];
      intersections.push(lineIntersect(lineAN, lineSB));
    }

    for (let step = 0; step < steps + 1; step++) {
      // if (reversed) {
      //   if (step === steps) {
      //     return;
      //   }
      // } else {
      if (step === 0) {
        continue;
      }
      // }
      try {
        let previous;
        if (reversed) {
          previous = intersections[step + 1];
        } else {
          previous = intersections[step - 1];
        }
        this.intersections[offsetStep + step] =
          this.run - distanceBetweenPoints(previous, intersections[step]);
      } catch (e) {}
    }
    return steps;
  }

  alongStinger(step: number): xy {
    let distance = round((step - 1) * this.run);
    const quart = (this.walkLineOffset * Math.PI) / 2;
    const half = (this.totalWidth - this.walkWidth * 2) / 2;
    const lengthRight = (this.stepsFlightRight + 1) * this.run;
    const lengthLeft = this.totalRun - lengthRight;
    const leftSide = lengthLeft - quart - half;

    const walkLineXY = this.alongWalkLine(step);
    const next = this.alongWalkLine(step + 1);
    const alpha = angleBetween(walkLineXY, next);

    const correction = isNaN(this.intersections[step])
      ? 0
      : this.intersections[step];

    if (distance < lengthLeft - half - quart / 2) {
      return [this.stairOrigin[0] + this.walkWidth, walkLineXY[1] + correction];
    } else if (distance === lengthLeft) {
      return [walkLineXY[0], walkLineXY[1] + correction];
    } else if (distance < lengthLeft) {
      return [walkLineXY[0] + correction, this.stairOrigin[1] + this.walkWidth];
    } else if (distance - lengthLeft < half + quart / 2) {
      return [walkLineXY[0] - correction, this.stairOrigin[1] + this.walkWidth];
    } else if (distance === this.totalRun) {
      return [walkLineXY[0] - correction, walkLineXY[1]];
    } else {
      return [
        this.stairOrigin[0] + this.totalWidth - this.walkWidth,
        walkLineXY[1] + correction,
      ];
    }
  }

  alongWalkLine(step: number): xy {
    let distance = (step - 1) * this.run;
    const quart = (this.walkLineOffset * Math.PI) / 2;
    const half = (this.totalWidth - this.walkWidth * 2) / 2;
    const lengthRight = (this.stepsFlightRight + 1) * this.run;
    const lengthLeft = this.totalRun - lengthRight;
    const leftSide = lengthLeft - quart - half;
    if (distance < leftSide) {
      const [x, y] = [
        this.stairOrigin[0] + this.walkWidth - this.walkLineOffset,
        this.stairOrigin[1] + this.walkWidth,
      ];
      return [x, y + leftSide - distance];
    } else if (distance < leftSide + quart) {
      distance -= leftSide;
      const ratio = distance / quart;
      return angleXY(180 + 90 * ratio, this.walkLineOffset, [
        this.stairOrigin[0] + this.walkWidth,
        this.stairOrigin[1] + this.walkWidth,
      ]);
    } else if (distance < lengthLeft) {
      distance -= leftSide + quart;
      const [x, y] = [
        this.stairOrigin[0] + this.walkWidth,
        this.stairOrigin[1] + this.walkWidth - this.walkLineOffset,
      ];
      return [x + distance, y];
    } else if (distance < lengthLeft + half) {
      distance -= lengthLeft;
      const [x, y] = [
        this.stairOrigin[0] + this.totalWidth / 2,
        this.stairOrigin[1] + this.walkWidth - this.walkLineOffset,
      ];
      return [x + distance, y];
    } else if (distance < lengthLeft + half + quart) {
      distance -= lengthLeft + half;
      const ratio = distance / quart;
      return angleXY(-90 + 90 * ratio, this.walkLineOffset, [
        this.stairOrigin[0] + this.totalWidth - this.walkWidth,
        this.stairOrigin[1] + this.walkWidth,
      ]);
    } else {
      distance -= lengthLeft + half + quart;
      const [x, y] = [
        this.stairOrigin[0] +
          this.totalWidth -
          this.walkWidth +
          this.walkLineOffset,
        this.stairOrigin[1] + this.walkWidth,
      ];
      return [x, y + distance];
    }
  }
}
