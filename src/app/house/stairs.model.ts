import { AppStair } from '../model/specific/stair-step.model';
import { AppPolygon } from '../model/polygon.model';
import { Cross } from 'src/app/house/cross.model';
import { AppPath } from 'src/app/model/path.model';
import {
  angleBetween,
  angleXY,
  findCircleLineIntersections,
  getDiagonal,
  lineIntersect,
  round,
} from 'src/app/shared/global-functions';
import { Measure } from 'src/app/model/specific/measure.model';
import { Floor } from '../components/enum.data';
import { BaseSVG } from '../model/base.model';
import { AppPolyline } from '../model/polyline.model';
import { AppCircle } from '../model/circle.model';
import * as d3 from 'd3';
import { AppStairPlan } from '../model/specific/stair-plan.model';
import { House } from 'src/app/house/house.model';

export class Stair {
  house: House;
  cross: Cross;
  // Inputs
  outerBase = -1;
  wallOuterThickness = -1;
  ceilingHeight = 3.3;
  floorThickness = 0.5;
  extensionToNorth = -1;

  // Elevation heights
  groundFloorTop = -1;
  topFloorTop = -1;
  topFloorBottom = -1;
  groundElevation = -1;

  // basics cross
  totalRise = -1;
  totalRun = 6;
  angle;
  run = 0.3;
  runThickness = 0.02;
  rise = 0.2;
  riseThickness = 0.02;
  nose = 0.02;
  steps = 20;
  maxSteps;
  minSteps;
  step;

  // basic plan
  walkWidth = 0.8;
  stairOrigin: [number, number] = [0, 0];
  stepsRight = 12;

  leftFlightSteps = 5;
  midFlightSteps = 4; // even!
  totalWidth = 2.7;
  totalHeight = -1;
  lesserHeight = -1;

  intersections = {};
  walkLineOffset = 0.3;

  parts: BaseSVG[] = [];

  constructor() {
    this.create();
  }

  create() {
    this.createBuilding();
    this.createStep();
    this.createMeasures();
    this.createPlan();
  }

  calculate(house) {
    this.house = house;

    this.outerBase = this.outerBase;
    this.wallOuterThickness = this.wallOuterThickness;
    this.extensionToNorth = this.extensionToNorth;
    this.ceilingHeight = this.house.cross.ceilingHeight;
    this.floorThickness = this.house.cross.floorThickness;

    // Elevation heights    this.totalRun = round(1, this.totalRise / Math.tan((35 * Math.PI) / 180));

    this.groundFloorTop = 0;
    this.topFloorTop = -this.house.cross.groundFloorTop; // 0

    this.totalRise = this.topFloorTop - this.groundFloorTop;
    this.stairOrigin = [
      this.house.stramien.in.we.b,
      this.house.extensionToNorth - 5,
    ];

    this.angle = round(
      this.house.stramien.in.ns.b,
      Math.atan(this.totalRise / this.totalRun) * (180 / Math.PI)
    );
    this.run = round(3, this.totalRun / this.steps);
    this.rise = round(3, this.totalRise / this.steps);
    this.step = round(3, this.run * 2 + this.run);
    this.maxSteps = Math.ceil(this.totalRise / 0.182);
    this.minSteps = Math.ceil(this.totalRise / 0.22);
    // this.totalWidth = this.walkWidth * 2 + this.midFlightSteps * this.run;

    const [y1, y2] = [
      this.alongWalkLine(1)[1] - this.stairOrigin[1],
      this.alongWalkLine(this.steps)[1] - this.stairOrigin[1],
    ];
    this.totalHeight = Math.max(y1, y2);
    this.lesserHeight = Math.min(y1, y2);

    this.calculateCorrectionArray();
  }

  createBuilding() {
    this.parts.push(
      new AppPolygon({
        selector: 'floor-groundfloor',
        floor: Floor.all,
        parent: this,
        onUpdate: function (stair: Stair) {
          this.coords = [
            [-stair.run, stair.groundFloorTop],
            [10, stair.groundFloorTop],
            [10, stair.groundFloorTop + stair.floorThickness],
            [-stair.run, stair.groundFloorTop + stair.floorThickness],
          ];
        },
      })
    );

    this.parts.push(
      new AppPolygon({
        selector: 'floor-topfloor-shadow',
        floor: Floor.all,
        parent: this,
        onUpdate: function (stair: Stair) {
          this.coords = [
            [stair.totalRun, -stair.topFloorTop],
            [-stair.run, -stair.topFloorTop],
            [-stair.run, -(stair.topFloorTop - stair.floorThickness)],
            [stair.totalRun, -(stair.topFloorTop - stair.floorThickness)],
          ];
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: 'floor-topfloor',
        floor: Floor.all,
        parent: this,
        onUpdate: function (stair: Stair) {
          this.coords = [
            [stair.totalRun + stair.nose, -stair.topFloorTop],
            [10, -stair.topFloorTop],
            [10, -(stair.topFloorTop - stair.floorThickness)],
            [
              stair.totalRun + stair.nose,
              -(stair.topFloorTop - stair.floorThickness),
            ],
          ];
        },
      })
    );
    this.parts.push(
      new AppPath({
        selector: 'nose-line',
        floor: Floor.all,
        parent: this,
        onUpdate: function (stair: Stair) {
          this.d = `M0 0 L${stair.totalRun} ${-stair.totalRise} `;
        },
      })
    );
    this.parts.push(
      new AppPath({
        selector: 'back-line',
        floor: Floor.all,
        parent: this,
        onUpdate: function (stair: Stair) {
          const pushOff = stair.run * 1;

          this.d = `M${pushOff} 0 L${angleXY(
            -stair.angle,
            -stair.run / Math.tan((stair.angle * Math.PI) / 180),
            [stair.totalRun + pushOff, -stair.totalRise]
          )}`;
        },
      })
    );
  }
  createStep() {
    for (let index = 1; index < 25; index++) {
      this.parts.push(
        new AppStair({
          selector: `step-${index}`,
          floor: Floor.all,
          parent: this,
          index: index,
          onUpdate: function (this: AppStair, stair: Stair) {
            this.visible = index < stair.steps;
          },
        })
      );
    }
  }
  createMeasures() {
    this.parts.push(
      new Measure({
        selector: 'run-size',
        floor: Floor.all,
        direction: -90,
        decimals: 3,
        onUpdate: function (stair: Stair) {
          this.offsetPixels = 0;
          this.offsetMeters = stair.rise * 1;
          this.distance = 0;
          this.a = [stair.run * 7, -stair.rise * 7];
          this.b = [stair.run * 8, -stair.rise * 8];
        },
      })
    );
    this.parts.push(
      new Measure({
        selector: 'rise-size',
        floor: Floor.all,
        direction: 180,
        offsetPixels: 0.5,
        decimals: 3,
        onUpdate: function (stair: Stair) {
          this.offsetPixels = 0;
          this.offsetMeters = stair.run * 1;
          this.distance = 0;
          this.a = [stair.run * 7, -stair.rise * 7];
          this.b = [stair.run * 8, -stair.rise * 8];
        },
      })
    );
    this.parts.push(
      new Measure({
        selector: 'total-rise-size',
        floor: Floor.all,
        direction: 0,
        offsetPixels: 0,
        onUpdate: function (stair: Stair) {
          const pushOff = stair.totalRun + stair.run * 2;
          this.offsetPixels = 0;
          this.offsetMeters = 0;
          this.distance = 0;
          this.a = [pushOff, 0];
          this.b = [pushOff, -stair.totalRise];
        },
      })
    );
    this.parts.push(
      new Measure({
        selector: 'total-run-size',
        floor: Floor.all,
        direction: 90,
        onUpdate: function (stair: Stair) {
          this.offsetPixels = 16;
          this.offsetMeters = 0;
          this.distance = 0;
          this.a = [0, 0];
          this.b = [stair.totalRun, 0];
        },
      })
    );

    // /plan

    this.parts.push(
      new Measure({
        selector: 'plateau-width',
        floor: Floor.all,
        direction: -90,
        onUpdate: function (stair: Stair) {
          const pushOff = stair.stairOrigin[1] - 0.5;
          this.offsetPixels = 0;
          this.offsetMeters = 0;
          this.distance = 0;
          this.a = [stair.stairOrigin[0] + 0, pushOff];
          this.b = [stair.stairOrigin[0] + stair.walkWidth, pushOff];
        },
      })
    );
    this.parts.push(
      new Measure({
        selector: 'mid-width',
        floor: Floor.all,
        direction: -90,
        onUpdate: function (stair: Stair) {
          const pushOff = stair.stairOrigin[1] - 0.5;
          this.offsetPixels = 0;
          this.offsetMeters = 0;
          this.distance = 0;
          this.a = [stair.stairOrigin[0] + stair.walkWidth, pushOff];
          this.b = [
            stair.stairOrigin[0] + stair.totalWidth - stair.walkWidth,
            pushOff,
          ];
        },
      })
    );
    this.parts.push(
      new Measure({
        selector: 'total-width',
        floor: Floor.all,
        direction: -90,
        onUpdate: function (stair: Stair) {
          const pushOff = stair.stairOrigin[1] - 0.5;
          this.offsetPixels = 16;
          this.offsetMeters = 0;
          this.distance = 0;
          this.a = [stair.stairOrigin[0], pushOff];
          this.b = [stair.stairOrigin[0] + stair.totalWidth, pushOff];
        },
      })
    );

    this.parts.push(
      new Measure({
        selector: 'total-height',
        floor: Floor.all,
        direction: 0,
        onUpdate: function (stair: Stair) {
          const pushOff = stair.stairOrigin[0] + stair.totalWidth + 0.5;
          this.offsetPixels = 16;
          this.offsetMeters = 0;
          this.distance = 0;
          this.b = [pushOff, stair.stairOrigin[1]];
          this.a = [pushOff, stair.stairOrigin[1] + stair.totalHeight];
        },
      })
    );
    this.parts.push(
      new Measure({
        selector: 'lesser-height',
        floor: Floor.all,
        direction: 0,
        onUpdate: function (stair: Stair) {
          const pushOff = stair.stairOrigin[0] + stair.totalWidth + 0.5;
          this.offsetPixels = 0;
          this.offsetMeters = 0;
          this.distance = 0;
          this.b = [pushOff, stair.stairOrigin[1]];
          this.a = [pushOff, stair.stairOrigin[1] + stair.lesserHeight];
        },
      })
    );
  }

  getAngle(rad, r, offset = [0, 0]) {
    const x = r * Math.cos(rad);
    const y = r * Math.sin(rad);
    return [x + offset[0], y + offset[1]];
  }

  createPlan() {
    for (let index = 1; index < this.steps + 1; index++) {
      this.parts.push(
        new AppStairPlan({
          selector: `step-plan-${index}`,
          floor: Floor.all,
          parent: this,
          index: index,
          onUpdate: function (this: AppStairPlan, stair: Stair) {
            this.walkLineXY = stair.alongWalkLine(index);
            this.nextWalkLineXY = stair.alongWalkLine(index + 1);
            this.stringerXY = stair.alongStinger(index);
            this.nextStingerXY = stair.alongStinger(index + 1);
          },
        })
      );
      this.parts.push(
        new AppCircle({
          selector: 'walk-line-' + index,
          floor: Floor.all,
          parent: this,
          onUpdate: function (this: AppCircle, stair: Stair) {
            this.r = this.lineThickness * 0.1;
            [this.cx, this.cy] = stair.alongWalkLine(index);
          },
        })
      );
      this.parts.push(
        new AppCircle({
          selector: 'step-stinger-' + index,
          floor: Floor.all,
          parent: this,
          onUpdate: function (this: AppCircle, stair: Stair) {
            this.r = this.lineThickness * 0.1;
            [this.cx, this.cy] = stair.alongStinger(index);
          },
        })
      );
    }

    this.parts.push(
      new AppPolygon({
        selector: 'clip-roof-ref',
        onUpdate: function (this: AppPolygon, stair: Stair) {
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
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: 'outline',
        floor: Floor.all,
        parent: this,
        onUpdate: function (this: AppPolygon, stair: Stair) {
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
      })
    );
    this.parts.push(
      new AppPolyline({
        selector: 'middleLine',
        floor: Floor.all,
        parent: this,
        lineThickness: 2,
        onUpdate: function (this: AppPolyline, stair: Stair) {
          const dx = stair.stairOrigin[0] + stair.totalWidth / 2;
          this.points = [
            [dx, stair.stairOrigin[1]],
            [dx, stair.stairOrigin[1] + stair.walkWidth],
          ];
        },
      })
    );
    this.parts.push(
      new AppPolyline({
        selector: 'left-corner-line',
        floor: Floor.all,
        parent: this,
        lineThickness: 2,
        onUpdate: function (this: AppPolyline, stair: Stair) {
          this.points = [
            [stair.stairOrigin[0], stair.stairOrigin[1]],
            [
              stair.stairOrigin[0] + stair.walkWidth,
              stair.stairOrigin[1] + stair.walkWidth,
            ],
          ];
        },
      })
    );
    this.parts.push(
      new AppPolyline({
        selector: 'right-corner-line',
        floor: Floor.all,
        parent: this,
        lineThickness: 2,
        onUpdate: function (this: AppPolyline, stair: Stair) {
          const [dx, dy] = [
            stair.stairOrigin[0] + stair.totalWidth,
            stair.stairOrigin[1],
          ];
          this.points = [
            [dx, dy],
            [dx - stair.walkWidth, dy + stair.walkWidth],
          ];
        },
      })
    );

    this.parts.push(
      new AppPath({
        selector: 'walk-line',
        floor: Floor.all,
        parent: this,
        onUpdate: function (this: AppPath, stair: Stair) {
          // /        a0.6,0.6 0 0 1 0.6,-0.4
          const rest = stair.walkWidth - stair.walkLineOffset;
          const right = stair.alongWalkLine(stair.steps);
          const left = stair.alongWalkLine(1);
          this.d = `
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
        },
      })
    );
  }

  calculateCorrectionArray() {
    const quart = (this.walkLineOffset * Math.PI) / 2;
    const half = (this.totalWidth - this.walkWidth * 2) / 2;
    const lengthRight = (this.stepsRight + 1) * this.run;
    const lengthLeft = this.totalRun - lengthRight;
    const leftSide = lengthLeft - quart - half;
    const rightSide = lengthRight - quart - half;

    const leftSkip = 0;

    const rightSkip = 0;
    this.intersections = {};

    // /////// lowerLeft
    const lowerLeftSteps = this.getEGMethod(
      leftSide + quart / 2,
      this.alongWalkLine(1)[1] - (this.stairOrigin[1] + this.walkWidth),
      leftSkip,
      this.run * leftSkip,
      false
    );

    // // /////// higherLeft;
    const higherLeftSteps = this.getEGMethod(
      half + quart / 2,
      this.totalWidth / 2 - this.walkWidth,
      lowerLeftSteps + leftSkip,
      0,
      true
    );
    /////// higherRight
    const higherRightSteps = this.getEGMethod(
      half + quart / 2,
      this.totalWidth / 2 - this.walkWidth,
      lowerLeftSteps + leftSkip + higherLeftSteps,
      this.run,
      false
    );
    // /////// lowerRight
    this.getEGMethod(
      rightSide + quart / 2,
      this.alongWalkLine(this.steps)[1] -
        (this.stairOrigin[1] + this.walkWidth),
      lowerLeftSteps + leftSkip + higherLeftSteps + higherRightSteps,
      this.run * rightSkip,
      true
    );
    // console.log(this.intersections);
  }

  getEGMethod(
    walkLineLength,
    stingerLength,
    offsetStep,
    skipLength,
    reversed = false
  ) {
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
      // console.log(step, offsetStep + step);
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
          this.run - getDiagonal(previous, intersections[step]);
      } catch (e) {}
    }
    return steps;
  }

  alongStinger(step: number) {
    let distance = (step - 1) * this.run;
    const quart = (this.walkLineOffset * Math.PI) / 2;
    const half = (this.totalWidth - this.walkWidth * 2) / 2;
    const lengthRight = (this.stepsRight + 1) * this.run;
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
    } else if (distance < lengthLeft) {
      return [walkLineXY[0] + correction, this.stairOrigin[1] + this.walkWidth];
    } else if (distance - lengthLeft < half + quart / 2) {
      return [walkLineXY[0] - correction, this.stairOrigin[1] + this.walkWidth];
    } else {
      return [
        this.stairOrigin[0] + this.totalWidth - this.walkWidth,
        walkLineXY[1] + correction,
      ];
    }
  }

  alongWalkLine(step: number) {
    let distance = (step - 1) * this.run;
    const quart = (this.walkLineOffset * Math.PI) / 2;
    const half = (this.totalWidth - this.walkWidth * 2) / 2;
    const lengthRight = (this.stepsRight + 1) * this.run;
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

    // const path = (
    //   d3.select('.walk-line') as d3.Selection<
    //     SVGPathElement,
    //     unknown,
    //     HTMLElement,
    //     any
    //   >
    // ).node();
    // if (path) {
    //   const d = path.getPointAtLength(index * this.run);
    //   return [d.x, d.y];
    // }
    return this.stairOrigin;
  }
}