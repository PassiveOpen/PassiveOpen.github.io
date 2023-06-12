import { degToRad } from "three/src/math/MathUtils";
import {
  angleXY,
  distanceBetweenPoints,
  round,
} from "../shared/global-functions";
import { Cross, RoofLength, RoofPoint } from "./cross.model";
import { House } from "./house.model";

export class Roof {
  house: House;
  cross: Cross;

  roofLengths: { [key in RoofLength]?: number } = {};

  roofTileLength = 0.375;

  upperRoofLowestRow = 0.3; // it lays over the mansard bend
  upperRoofRidgeOffset = 0.03; // offset from ridge
  upperRoofTileLength;
  upperRoofTiles; // minium of tiles needed to cover the upper roof
  upperRoofTilesSpacer; // space between every tile holder

  lowerRoofTileLength;
  lowerRoofTiles; // minium of tiles needed to cover the lower roof
  lowerRoofTilesSpacer; // space between every tile holder

  kickerRoofTiles = 2;
  kickerRoofTileLength;
  kickerRoofTilesSpacer = 0.35;
  kickerRoofAngle = 12.5;

  constructor() {}

  calculate(cross: Cross) {
    this.cross = cross;
    this.house = cross.house;

    this.roofLengths = {
      [RoofLength.upper]: round(
        distanceBetweenPoints(
          this.cross.roofPoints[RoofPoint.bendOutside],
          this.cross.roofPoints[RoofPoint.topOutside]
        )
      ),
      [RoofLength.lower]: round(
        distanceBetweenPoints(
          this.cross.roofPoints[RoofPoint.lowestOutside],
          this.cross.roofPoints[RoofPoint.bendOutside]
        )
      ),
      [RoofLength.sprocket]: round(
        this.kickerRoofTiles * this.kickerRoofTilesSpacer
      ),
    };

    this.getUpperRoofTiles();
    this.getLowerRoofTiles();
    this.getKickerRoofTiles();

    this.calculateSprocket();
  }

  calculateSprocket() {
    const originalEdge = this.cross.roofPoints[RoofPoint.lowestOutside];

    const verticalFromLowToStartKick =
      Math.sin(degToRad(70 - this.kickerRoofAngle)) * this.kickerRoofTileLength;

    const offsetOn70Roof = verticalFromLowToStartKick / Math.sin(degToRad(70));
    this.cross.roofPoints[RoofPoint.sprocketOutside] = angleXY(
      70,
      offsetOn70Roof,
      originalEdge
    );

    this.cross.roofPoints[RoofPoint.footOutside] = angleXY(
      180 + (70 - this.kickerRoofAngle),
      this.kickerRoofTileLength,
      this.cross.roofPoints[RoofPoint.sprocketOutside]
    );
  }

  getUpperRoofTiles() {
    this.upperRoofTileLength =
      this.roofLengths[RoofLength.upper] -
      this.upperRoofRidgeOffset -
      this.upperRoofLowestRow;

    this.upperRoofTiles =
      Math.ceil(this.upperRoofTileLength / this.roofTileLength) + 1; // +1 for over the bend
    this.upperRoofTilesSpacer =
      this.upperRoofTileLength / (this.upperRoofTiles - 1);
  }

  getLowerRoofTiles() {
    this.lowerRoofTileLength = this.roofLengths[RoofLength.lower];

    this.lowerRoofTiles = Math.ceil(
      this.lowerRoofTileLength / this.roofTileLength
    );

    this.lowerRoofTilesSpacer = this.lowerRoofTileLength / this.lowerRoofTiles;
  }

  getKickerRoofTiles() {
    this.kickerRoofTileLength = this.roofLengths[RoofLength.sprocket];
  }
}
