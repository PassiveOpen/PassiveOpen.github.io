import { Floor, Graphic } from "src/app/components/enum.data";
import { House, HousePart, xy } from "src/app/house/house.model";
import { Stair, Stringers } from "src/app/house/stairs.model";
import { HousePartModel } from "./model/housePart.model";
import { StairPlanSVG } from "./svg/stair-plan.svg";
import {
  angleBetween,
  angleXY,
  distanceBetweenPoints,
  multiLineIntersect,
} from "../shared/global-functions";
import { StairCrossSVG } from "./svg/stair-cross.svg";

export class StairModel extends HousePartModel {
  housePart = HousePart.stairPlan;
  floor = Floor.all;
  name = "step";
  parent: Stair;
  last = false;
  visible = true;
  fontSize = 10;
  walkLineXY: xy = [0, 0];
  nextWalkLineXY: xy = [0, 0];
  stringerXY: xy = [0, 0];
  nextStingerXY: xy = [0, 0];
  stringers: Stringers;
  index = 0;
  direction: number;
  textXY: xy;
  riseDeg: number;
  nextRiseDeg: number;
  farOuterStingerXY: xy;
  nextFarOuterStingerXY: xy;
  outerStinger: xy;
  nextOuterStinger: xy;
  corner1: xy;
  corner2: xy;
  outerCorner: any;
  innerCorner: any;

  onUpdate(house: House): void {}
  afterUpdate(): void {
    const stair = this.parent;
    this.direction = angleBetween(this.walkLineXY, this.nextWalkLineXY);
    this.textXY = angleXY(
      this.direction - 45,
      this.parent.run * 0.8,
      this.walkLineXY
    );

    this.riseDeg = angleBetween(this.stringerXY, this.walkLineXY);
    this.nextRiseDeg = angleBetween(this.nextStingerXY, this.nextWalkLineXY);
    this.farOuterStingerXY = angleXY(this.riseDeg, 10, this.walkLineXY);
    this.nextFarOuterStingerXY = angleXY(
      this.nextRiseDeg,
      10,
      this.nextWalkLineXY
    );

    this.outerStinger = multiLineIntersect(stair.stringers.out.coords, [
      this.stringerXY,
      this.farOuterStingerXY,
    ])
      .map((x) => ({
        xy: x,
        d: distanceBetweenPoints(x, this.stringerXY),
      }))
      .sort((a, b) => a.d - b.d)
      .map((x) => x.xy)[0];

    this.nextOuterStinger = multiLineIntersect(stair.stringers.out.coords, [
      this.nextStingerXY,
      this.nextFarOuterStingerXY,
    ])
      .map((x) => ({
        xy: x,
        d: distanceBetweenPoints(x, this.nextStingerXY),
      }))
      .sort((a, b) => a.d - b.d)
      .map((x) => x.xy)[0];

    this.corner1 = stair.stringers.out.coords[1];
    this.corner2 = stair.stringers.out.coords[2];
    this.outerCorner = null;
    this.innerCorner = null;
    if (
      this.corner1[1] !== this.outerStinger[1] &&
      this.corner1[1] === this.nextOuterStinger[1]
    ) {
      this.innerCorner = stair.stringers.in.coords[1];
      this.outerCorner = stair.stringers.out.coords[1];
    }
    if (
      this.corner2[0] !== this.outerStinger[0] &&
      this.corner2[0] === this.nextOuterStinger[0]
    ) {
      this.innerCorner = stair.stringers.in.coords[2];
      this.outerCorner = stair.stringers.out.coords[2];
    }
  }
  getSVGInstance(graphic: Graphic): void {
    if (graphic === Graphic.stairPlan) {
      this.svg = new StairPlanSVG(this);
    } else if (graphic === Graphic.stairCross) {
      this.svg = new StairCrossSVG(this);
    } else {
    }
  }

  constructor(data: Partial<StairModel>) {
    super();
    Object.assign(this, data);
  }
}
