import {
  angleBetween,
  angleXY,
  distanceBetweenPoints,
  round,
} from "src/app/shared/global-functions";
import { Floor } from "../components/enum.data";
import { House, HousePart, xy } from "../house/house.model";
import { HousePartModel } from "./model/housePart.model";
import { Room } from "./room.model";
import { WallSVG } from "./svg/wall.svg";

let ids = {};

export enum WallType {
  outer = "outer",
  inner = "inner",
  theoretic = "theoretic",
}
export enum WallSide {
  in = "in",
  out = "out",
  left = "left",
  right = "right",
}

export enum CornerType {
  inside = "inside",
  outside = "outside",
  tower = "tower",
  straight = "straight",
}
type Sides = {
  [key in WallSide]?: [number, number][];
};

export class Wall extends HousePartModel {
  housePart = HousePart.walls;

  type: WallType;
  sides: Sides;
  thickness: number;
  parent: Room;
  origin: [number, number] = [0, 0];
  innerWallLength: number;
  outerWallLength: number;
  orientation = "";
  ceiling: number = -1;
  gable = false;
  tower = false;
  floor: Floor;
  visible = true;
  angle: number;

  constructor(data: Partial<Wall>) {
    super();
    Object.assign(this, data);
  }

  getSVGInstance() {
    this.svg = new WallSVG(this);
  }

  onUpdate(house: House) {} // in user data
  afterUpdate() {
    this.angle = angleBetween(
      this.sides[WallSide.in][0],
      this.sides[WallSide.in][1]
    );

    if (this.angle === 90 * 0) {
      this.orientation = `North`;
    } else if (this.angle === 45) {
      this.orientation = `NortEast`;
    } else if (this.angle === -45 || this.angle === 360 - 45) {
      this.orientation = `NorthWest`;
    } else if (this.angle === 90 * 1) {
      this.orientation = `East`;
    } else if (this.angle === 90 * 2) {
      this.orientation = `South`;
    } else if (this.angle === 90 * 3 || this.angle === -90) {
      this.orientation = `West`;
    } else {
      this.orientation = `${this.angle}`.split(".")[0];
    }

    if (!(this.selector in ids)) ids[this.selector] = 0;
    ids[this.selector]++;

    this.selector = `${this.parent.name}-wall-${this.orientation}-${
      ids[this.selector]
    }`;
  }

  getLength(side: WallSide, decimals = 2) {
    const arr = this.sides[side];
    if (!arr || !arr[0] || !arr[1]) return 0;
    return round(
      distanceBetweenPoints(...(arr as [[number, number], [number, number]])),
      decimals
    );
  }

  getArea(side: WallSide, decimals = 2) {
    const l = this.getLength(side);
    if (l === 0) return 0;
    if (this.gable) {
      // todo, calc gables
      return round(l * this.ceiling, decimals);
    } else {
      return round(l * this.ceiling, decimals);
    }
  }

  getPosition(side: WallSide, ratio, offset = 0): xy {
    const arr = this.sides[side];
    const distance = this.getLength(side) * ratio;
    const angle = angleBetween(arr[0], arr[1]);
    return angleXY(angle, distance + offset, arr[0]);
  }

  drawTheoretic(orientation: "w" | "n" | "e" | "s", house, thickness) {
    this.thickness = thickness;
    if (orientation === "n") {
      this.drawByRoom(0, 1, house, CornerType.straight, CornerType.straight);
    }
    if (orientation === "e") {
      this.drawByRoom(1, 2, house, CornerType.straight, CornerType.straight);
    }
    if (orientation === "s") {
      this.drawByRoom(2, 3, house, CornerType.straight, CornerType.straight);
    }
    if (orientation === "w") {
      this.drawByRoom(3, 0, house, CornerType.straight, CornerType.straight);
    }
  }

  drawByRoom(
    i,
    j,
    house: House,
    firstCorner: CornerType,
    secondCorner: CornerType
  ) {
    if (this.type === WallType.inner) {
      this.thickness = house.wallInnerThickness;
      this.ceiling = house.cross.ceilingHeight;
    } else if (this.type === WallType.outer) {
      this.thickness = house.wallOuterThickness;
      this.ceiling = house.cross.outerWallHeight;
    } else if (this.type === WallType.theoretic) {
      this.ceiling = house.cross.ceilingHeight;
    } else {
      console.error(this);
    }

    const getAngle = (ii, type: CornerType, angle) => {
      if (type === CornerType.inside && ii === 0) return angle + 45;
      if (type === CornerType.inside && ii === 1) return angle - 45;
      if (type === CornerType.outside && ii === 0) return angle - 45;
      if (type === CornerType.outside && ii === 1) return angle + 45;
      if (type === CornerType.tower && ii === 0) return angle + (45 + 45 / 2);
      if (type === CornerType.tower && ii === 1) return angle - (45 + 45 / 2);
      if (type === CornerType.straight) return angle;
    };
    const getDistance = (cornerType: CornerType) => {
      const dio = Math.sqrt(this.thickness ** 2 * 2);
      const t = house.tower;

      if (cornerType === CornerType.inside) return dio;
      if (cornerType === CornerType.outside) return dio;
      if (cornerType === CornerType.tower)
        return distanceBetweenPoints(t.innerCoords[0], t.outerCoords[7]);
      if (cornerType === CornerType.straight) return this.thickness;
    };

    let first = this.parent.coords[i];
    let second = this.parent.coords[j];

    this.origin = first;
    this.innerWallLength = distanceBetweenPoints(first, second);
    let angle = angleBetween(first, second) - 90;

    this.sides = {
      [WallSide.in]: [first, second],
    };

    if (this.type !== WallType.theoretic) {
      this.sides[WallSide.out] = [
        angleXY(
          getAngle(0, firstCorner, angle),
          getDistance(firstCorner),
          first
        ),
        angleXY(
          getAngle(1, secondCorner, angle),
          getDistance(secondCorner),
          second
        ),
      ];
    }
  }

  getFootPrint() {
    if (!this.sides) return [];
    const result = [];
    if (this.sides[WallSide.in]) result.push(...this.sides[WallSide.in]);
    if (this.sides[WallSide.out])
      result.push(...this.sides[WallSide.out].reverse());
    return result;
  }
}
