import { AppPolygon } from "../model/polygon.model";
import { House, xy } from "./house.model";
import { AppPolyline } from "../model/polyline.model";
import { AppPath } from "src/app/model/path.model";
import { BaseSVG } from "../model/base.model";
import {
  angleBetween,
  angleXY,
  distanceBetweenPoints,
  lineIntersect,
  offset,
  rotateXY,
  round,
  sum,
} from "../shared/global-functions";
import { Measure } from "../house-parts/measure.model";
import { Floor, Tag } from "../components/enum.data";
import { degToRad, radToDeg } from "three/src/math/MathUtils";
import { AppDistance } from "../model/distance.model";
import { Roof } from "./roof.model";

export enum RoofPoint {
  topFloor = "topFloor",

  wallOutside = "wallOutside",
  wallInside = "wallInside",
  bendInside = "bendInside",
  bendOutside = "bendOutside",
  topInside = "topInside",
  topOutside = "topOutside",
  lowestInside = "lowestInside",
  lowestOutside = "lowestOutside",
  groundFloorInside = "groundFloorInside",
  groundFloorOutside = "groundFloorOutside",

  sprocketOutside = "sprocketOutside",
  footInside = "footInside",
  footOutside = "footOutside",

  topFacade = "topFacade",
}
export enum Elevation {
  ground = "ground",
  crawlerFloor = "crawlerFloor",
  crawlerCeiling = "crawlerCeiling",
  groundFloor = "groundFloor",
  ceiling = "ceiling",
  topFloor = "topFloor",
  towerTop = "towerTop",
}

export enum RoofType {
  outer = "outer",
  inner = "inner",
  sketch = "sketch",
  shadow = "shadow",
}
export enum RoofStyle {
  roof70 = "roof70",
  roofCircle = "roofCircle",
  roofCircleAnd70 = "roofCircleAnd70",
}

export enum RoofLength {
  upper = "upper",
  lower = "lower",
  sprocket = "sprocket",
}

export class Cross {
  house: House;
  roof = new Roof();
  // Inputs
  innerWidth = -1;
  wallOuterThickness = -1;
  ceilingHeight = -1;
  floorAboveGround = -1;
  crawlerHeight = -1;
  crawlerSpace = false;

  topFloorThickness = 400 / 1000;
  groundFloorThickness = 480 / 1000;

  roofCenter = [];
  roofThickness = 400 / 1000;
  roofCirclePullDown = 1;
  roofCircleExtra = -1;
  roofCircleWalls = 1;
  roof70offset = 0.6;
  roof70Extension = 1.3;
  roof70Walls = 1.4;
  roofRidgeHight = 600 / 1000;
  roofRidgeWidth = 40 / 1000;

  bendPoint = [-1, -1];
  bendPointInner = [-1, -1];

  // Elevation heights
  elevations: { [key in Elevation | RoofPoint]?: number } = {};
  roofPoints: { [key in RoofPoint]?: xy } = {};

  outerWallHeight = -1;
  innerWallHeight = -1;
  gableWallArea = -1;

  minimumHeight = 1.5;
  minimumHeightWidth = -1;
  minimumHeightRoom = 2.3;
  minimumHeightRoomWidth = -1;

  roofStyle: RoofStyle = RoofStyle.roof70;
  viewedRoofStyle: RoofStyle = RoofStyle.roof70;
  parts: BaseSVG[] = [];
  lowerAngle: number;
  upperAngle: number;

  constructor() {
    this.parts.push(new AppDistance());
  }

  calculate(house) {
    this.house = house;
    this.innerWidth = this.house.outerBase;
    this.wallOuterThickness = this.house.wallOuterThickness;
    this.roofCircleExtra = round(
      Math.cos(degToRad(65)) * this.roofCirclePullDown,
      3
    );

    // BendPoint
    this.bendPoint = [
      this.roof70offset,
      -this.roof70offset * Math.tan(degToRad(70)) - this.roof70Walls,
    ];
    this.bendPointInner = [
      this.roof70offset,
      -this.roof70offset * Math.tan(degToRad(70)),
    ];

    const groundFloor = 0;
    const groundFloorBottom = groundFloor - this.groundFloorThickness;
    const groundElevation =
      groundFloorBottom -
      (this.crawlerSpace ? this.floorAboveGround : 0) +
      this.groundFloorThickness;
    const groundFloorTop = groundFloorBottom + this.groundFloorThickness;
    const topFloorBottom = groundFloorTop + this.ceilingHeight;
    const topFloorTop = topFloorBottom + this.topFloorThickness;

    this.elevations = {
      [Elevation.ground]: groundElevation,
      [Elevation.crawlerFloor]:
        groundFloorBottom - (this.crawlerSpace ? this.crawlerHeight : 0),
      [Elevation.crawlerCeiling]: groundFloorBottom,
      [Elevation.groundFloor]: 0,
      [Elevation.ceiling]: topFloorBottom,
      [Elevation.topFloor]: topFloorTop,
    };

    this.roofCenter = [
      round(this.house.outerBase / 2),
      round(this.elevations[Elevation.topFloor]),
    ];

    this.roofPoints = {
      ...this.roofPoints,
      [RoofPoint.topFloor]: [this.wallOuterThickness, this.roofCenter[1]],
      [RoofPoint.groundFloorOutside]: [0, 0],
      [RoofPoint.groundFloorInside]: [this.wallOuterThickness, 0],
    };

    if (this.viewedRoofStyle === RoofStyle.roof70) {
      const roofPoints = this.pointOf70Roof();

      this.roofPoints = {
        ...this.roofPoints,
        [RoofPoint.bendOutside]: roofPoints[2],
        [RoofPoint.bendInside]: roofPoints[11],
        [RoofPoint.topInside]: roofPoints[10],
        [RoofPoint.topOutside]: roofPoints[3],
        [RoofPoint.lowestInside]: roofPoints[13],
        [RoofPoint.lowestOutside]: roofPoints[0],
      };
    }
    if (this.viewedRoofStyle === RoofStyle.roofCircle) {
      const getPoint = (i, type): xy => {
        const [x, y] = this.pointOnCircleRoof(Math.PI * -((4 - i) / 4), type);
        return [x, y];
      };

      this.roofPoints = {
        ...this.roofPoints,
        [RoofPoint.bendOutside]: getPoint(1, RoofType.outer),
        [RoofPoint.bendInside]: getPoint(1, RoofType.inner),
        [RoofPoint.topInside]: getPoint(2, RoofType.inner),
        [RoofPoint.topOutside]: getPoint(2, RoofType.outer),
        [RoofPoint.lowestInside]: getPoint(0, RoofType.inner),
        [RoofPoint.lowestOutside]: getPoint(0, RoofType.outer),
      };
    }
    this.roofPoints[RoofPoint.wallInside] = this.calcPointUnderInnerWall();
    this.roofPoints[RoofPoint.wallOutside] = this.calcPointUnderOuterWall();
    this.roofPoints[RoofPoint.topFacade] = this.calcPointTopFacade();

    Object.entries(this.roofPoints).forEach(([k, v], i) => {
      this.elevations[k] = round(v[1]);
    });

    this.gableWallArea = this.calculateGable();
    this.innerWallHeight = Math.abs(this.roofPoints[RoofPoint.wallInside][1]);
    this.outerWallHeight = Math.abs(this.roofPoints[RoofPoint.wallOutside][1]);

    (this.elevations[Elevation.towerTop] =
      this.elevations[RoofPoint.topOutside] - 0.5),
      (this.minimumHeightWidth = round(
        this.getIntersectionWithRoof(this.minimumHeight)[0]
      ));
    this.minimumHeightRoomWidth = round(
      this.getIntersectionWithRoof(this.minimumHeightRoom)[0]
    );

    this.lowerAngle = round(
      angleBetween(
        this.roofPoints[RoofPoint.lowestOutside],
        this.roofPoints[RoofPoint.bendOutside]
      ),
      3
    );
    this.upperAngle = round(
      angleBetween(
        this.roofPoints[RoofPoint.bendOutside],
        this.roofPoints[RoofPoint.topOutside]
      ),
      3
    );
    this.roof.calculate(this);
  }

  calculateGable(): number {
    const floor = this.roofPoints[RoofPoint.topFloor];
    const wall = this.roofPoints[RoofPoint.wallInside];
    const bend = this.roofPoints[RoofPoint.bendInside];
    const top = this.roofPoints[RoofPoint.topInside];
    const leftSquared = wall[1] * bend[0];
    const leftTriangle = ((bend[1] - wall[1]) * bend[0]) / 2;
    const rightSquared = (top[0] - bend[0]) * bend[1];
    const rightTriangle = ((top[0] - bend[0]) * (top[1] - bend[1])) / 2;
    return sum([leftSquared + leftTriangle + rightSquared + rightTriangle]) * 2;
  }

  calcPointTopFacade(): xy {
    let [x, y] = lineIntersect(
      [
        [0, 0],
        [0, 100],
      ],
      [
        this.roofPoints[RoofPoint.lowestOutside],
        this.roofPoints[RoofPoint.bendOutside],
      ]
    );
    return [x, y];
  }

  calcPointUnderInnerWall(): xy {
    const low = this.roofPoints[RoofPoint.lowestInside];
    let [x, y] = lineIntersect(
      [
        [this.wallOuterThickness, -100],
        [this.wallOuterThickness, 100],
      ],
      [low, this.roofPoints[RoofPoint.bendInside]]
    );
    return [x, y];
  }

  calcPointUnderOuterWall(): xy {
    const low = this.roofPoints[RoofPoint.lowestInside];
    let [x, y] = lineIntersect(
      [
        [0, -100],
        [0, 100],
      ],
      [low, this.roofPoints[RoofPoint.bendInside]]
    );

    if (low[0] > 0) {
      y = low[1];
    }
    return [x, y];
  }

  getIntersectionWithRoof(incomingLine: number): xy {
    const correctedLine = this.elevations[Elevation.topFloor] + incomingLine;
    const total: xy[] = [];
    const wall = [
      this.roofPoints[RoofPoint.topFloor],
      this.roofPoints[RoofPoint.wallInside],
    ];
    const lower = [
      this.roofPoints[RoofPoint.wallInside],
      this.roofPoints[RoofPoint.bendInside],
    ];
    const higher = [
      this.roofPoints[RoofPoint.bendInside],
      this.roofPoints[RoofPoint.topInside],
    ];
    [wall, lower, higher].forEach((line, i, arr) => {
      const xy = lineIntersect(line, [
        [-100, correctedLine],
        [100, correctedLine],
      ]);
      total.push(xy);
    });

    let farthest = total.sort((a, b) => b[0] - a[0])[0];
    // if (farthest[0] >= (this.innerWidth - this.wallOuterThickness) / 2) {
    //   return this.innerRoofContourLine[3];
    // }
    return farthest;
  }

  // Helpers

  pointOf70Roof(extened = false): xy[] {
    const h70RoofThickness = this.roofThickness / Math.sin(degToRad(70));
    const bendExtraOutside = this.roofThickness / Math.tan(degToRad(70)); /// 18.20
    const lengthConnection = Math.sqrt(
      bendExtraOutside ** 2 + this.roofThickness ** 2
    );

    const h30RoofThickness = this.roofThickness / Math.sin(degToRad(30));

    const half = this.innerWidth / 2;
    const h70 = this.roof70offset;
    const v70 = h70 * Math.tan(degToRad(70)) + this.roof70Walls;

    const x = angleXY(-40, lengthConnection);

    const h70in = h70 + x[0];
    const v70in = v70 + x[1];

    const h30 = half - h70;
    const v30 = h30 * Math.tan(degToRad(30));
    const vMid = v30 + v70;

    return [
      // Outside left-to-right:
      this.angle(degToRad(180 - 70), this.roof70Extension, [
        0,
        -this.roof70Walls,
      ]),
      [0, -this.roof70Walls],
      [h70, -v70],
      [half, -vMid], // center
      [this.innerWidth - h70, -v70],
      [this.innerWidth, -this.roof70Walls],
      this.angle(degToRad(70), this.roof70Extension, [
        this.innerWidth,
        -this.roof70Walls,
      ]),
      // Inside:

      this.angle(degToRad(70), this.roof70Extension, [
        this.innerWidth - h70RoofThickness,
        -this.roof70Walls,
      ]),
      [this.innerWidth - h70RoofThickness, -this.roof70Walls],
      [this.innerWidth - h70in, -v70in],
      offset([half, -vMid], [0, this.roofThickness / Math.cos(degToRad(30))]), // center
      [h70in, -v70in],
      [h70RoofThickness, -this.roof70Walls],
      this.angle(degToRad(180 - 70), this.roof70Extension, [
        h70RoofThickness,
        -this.roof70Walls,
      ]),
    ].map(([x, y]) => [round(x, 40), round(this.roofCenter[1] + -y, 40)]);
  }

  pointOnCircleRoof(rad, roofType: RoofType): xy {
    let r;
    const t = this.roofThickness / Math.cos(degToRad(22.5));
    if (roofType === RoofType.outer) {
      r = this.innerWidth / 2 + this.roofCircleExtra;
    }
    if (roofType === RoofType.inner) {
      r = this.innerWidth / 2 - t + this.roofCircleExtra;
    }
    if (roofType === RoofType.sketch) {
      r = this.innerWidth / 2 + t * 1.5 + this.roofCircleExtra;
    }

    const [x, y] = angleXY(radToDeg(rad), r);

    return [
      round(this.roofCenter[0] + x),
      round(
        this.roofCenter[1] +
          Math.abs(y) +
          this.roofCircleWalls -
          this.roofCirclePullDown
      ),
    ];
  }

  angle(rad, r, offset = [0, 0]): xy {
    const x = r * Math.cos(rad);
    const y = r * Math.sin(rad);
    return [x + offset[0], y + offset[1]];
  }
}
