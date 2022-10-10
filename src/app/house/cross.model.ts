import { AppPolygon } from "../model/polygon.model";
import { House, xy } from "./house.model";
import { AppPolyline } from "../model/polyline.model";
import { AppPath } from "src/app/model/path.model";
import { BaseSVG } from "../model/base.model";
import {
  angleBetween,
  angleXY,
  lineIntersect,
  offset,
  round,
  sum,
} from "../shared/global-functions";
import { Measure } from "../model/specific/measure.model";
import { Floor, Tag } from "../components/enum.data";
import { degToRad } from "three/src/math/MathUtils";

export enum RoofPoint {
  roofFloor = "roofFloor",

  roofWallOuter = "roofWallOuter",
  roofWallInner = "roofWallInner",
  roofBendInside = "roofBendInside",
  roofBendOutside = "roofBendOutside",
  roofTopInside = "roofTopInside",
  roofTopOutside = "roofTopOutside",
  roofLowestInside = "roofLowestInside",
  roofStartInside = "roofStartInside",
  roofLowestOutside = "roofLowestOutside",
}
export enum Elevation {
  ground = "ground",
  crawlerFloor = "crawlerFloor",
  crawlerCeiling = "crawlerCeiling",
  groundFloor = "groundFloor",
  ceiling = "ceiling",
  topFloor = "topFloor",
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

export class Cross {
  house: House;
  // Inputs
  innerWidth = -1;
  wallOuterThickness = -1;
  roofThickness = 0.4;

  ceilingHeight = 3.3;
  floorAboveGround = 0.7;
  crawlerHeight = 1.0;
  crawlerSpace = true;
  topFloorThickness = 0.48;
  groundFloorThickness = 0.48;

  roofCenter = [];
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

  houseHeight = -1;

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

  constructor() {
    this.create();
  }
  create() {
    this.createCircleRoof();
    this.createBuilding();
    this.create70Roof();
    this.createHelpers();
    this.parts.push(
      new AppPolygon({
        selector: "clip-roof",
        name: "#clip-roof",
        onUpdate: function (this: AppPolygon, cross: Cross) {
          this.coords = [
            [0, -cross.roof70Walls],
            [0, -cross.innerWidth],
            [cross.innerWidth, -cross.innerWidth],
            [cross.innerWidth, -cross.roof70Walls],
            [cross.innerWidth - cross.wallOuterThickness, -cross.roof70Walls],
            [cross.innerWidth - cross.wallOuterThickness, 0],
            [cross.wallOuterThickness, 0],
            [cross.wallOuterThickness, -cross.roof70Walls],
            ,
          ];
        },
      })
    );
    // .push(//   new AppPolygon('cross-roof', function (cross: Cross) {
    //   selector:    // this.parts['.XXX'] = [,
    //     this.coords = [];
    //   }),
    // ];
  }

  calculate(house) {
    this.house = house;
    this.innerWidth = this.house.outerBase;
    this.wallOuterThickness = this.house.wallOuterThickness;
    this.roofCircleExtra = round(
      Math.cos((65 * Math.PI) / 180) * this.roofCirclePullDown,
      3
    );

    // BendPoint
    this.bendPoint = [
      this.roof70offset,
      -this.getAngle(70, this.roof70offset) - this.roof70Walls,
    ];
    this.bendPointInner = [
      this.roof70offset,
      -this.getAngle(70, this.roof70offset),
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

    // console.log(this.elevations);

    this.roofCenter = [
      this.house.outerBase / 2,
      -this.elevations[Elevation.topFloor],
    ];

    this.roofPoints = {
      [RoofPoint.roofFloor]: [this.wallOuterThickness, this.roofCenter[1]],
      [RoofPoint.roofStartInside]: [
        this.wallOuterThickness,
        this.roofCenter[1],
      ],
    };

    if (this.viewedRoofStyle === RoofStyle.roof70) {
      const roofPoints = this.pointOfRoof();
      // .map(
      //   ([x, y]) => [Math.abs(x), Math.abs(y)] as xy
      // );
      this.roofPoints = {
        ...this.roofPoints,
        [RoofPoint.roofBendOutside]: roofPoints[2],
        [RoofPoint.roofBendInside]: roofPoints[11],
        [RoofPoint.roofTopInside]: roofPoints[10],
        [RoofPoint.roofTopOutside]: roofPoints[3],
        [RoofPoint.roofLowestInside]: roofPoints[13],
        [RoofPoint.roofLowestOutside]: roofPoints[0],
      };
    }

    if (this.viewedRoofStyle === RoofStyle.roofCircle) {
      const getPoint = (i, type): xy => {
        const [x, y] = this.pointOnCircleRoof(Math.PI * -((4 - i) / 4), type);
        return [x, y - this.roofCircleWalls];
      };
      this.roofPoints = {
        ...this.roofPoints,
        [RoofPoint.roofBendOutside]: getPoint(1, RoofType.outer),
        [RoofPoint.roofBendInside]: getPoint(1, RoofType.inner),
        [RoofPoint.roofTopInside]: getPoint(2, RoofType.inner),
        [RoofPoint.roofTopOutside]: getPoint(2, RoofType.outer),
        [RoofPoint.roofLowestInside]: getPoint(0, RoofType.inner),
        [RoofPoint.roofLowestOutside]: getPoint(0, RoofType.outer),
      };
    }
    this.roofPoints[RoofPoint.roofWallInner] = this.calcPointUnderInnerWall();
    this.roofPoints[RoofPoint.roofWallOuter] = this.calcPointUnderOuterWall();

    Object.entries(this.roofPoints).forEach(([k, v], i) => {
      this.elevations[k] = round(v[1]);
    });

    this.gableWallArea = this.calculateGable();
    this.innerWallHeight = Math.abs(this.roofPoints[RoofPoint.roofWallInner][1]);
    this.outerWallHeight = Math.abs(this.roofPoints[RoofPoint.roofWallOuter][1]);

    this.minimumHeightWidth = round(
      this.getIntersectionWithRoof(this.minimumHeight)[0]
    );
    this.minimumHeightRoomWidth = round(
      this.getIntersectionWithRoof(this.minimumHeightRoom)[0]
    );
  }
  calculateGable(): number {
    const floor = this.roofPoints[RoofPoint.roofFloor];
    const wall = this.roofPoints[RoofPoint.roofWallInner];
    const bend = this.roofPoints[RoofPoint.roofBendInside];
    const top = this.roofPoints[RoofPoint.roofTopInside];
    const leftSquared = wall[1] * bend[0];
    const leftTriangle = ((bend[1] - wall[1]) * bend[0]) / 2;
    const rightSquared = (top[0] - bend[0]) * bend[1];
    const rightTriangle = ((top[0] - bend[0]) * (top[1] - bend[1])) / 2;
    return sum([leftSquared + leftTriangle + rightSquared + rightTriangle]) * 2;
  }

  calcPointUnderInnerWall(): xy {
    const low = this.roofPoints[RoofPoint.roofLowestInside];
    let [x, y] = lineIntersect(
      [
        [this.wallOuterThickness, -100],
        [this.wallOuterThickness, 100],
      ],
      [low, this.roofPoints[RoofPoint.roofBendInside]]
    );
    // console.log(y, this.elevations[Elevation.topFloor]);
    // if (y < -this.elevations[Elevation.topFloor]) {
    //   y = -this.elevations[Elevation.topFloor];
    // }
    // console.log(y, this.elevations[Elevation.topFloor]);

    return [x, y];
  }

  calcPointUnderOuterWall(): xy {
    const low = this.roofPoints[RoofPoint.roofLowestInside];
    let [x, y] = lineIntersect(
      [
        [0, -100],
        [0, 100],
      ],
      [low, this.roofPoints[RoofPoint.roofBendInside]]
    );

    if (low[0] > 0) {
      y = low[1];
    }
    return [x, y];
  }

  createBuilding() {
    this.parts.push(
      new AppPolygon({
        selector: "building-ground-fill",
        onUpdate: function (this: AppPolygon, cross: Cross) {
          const margin = 1.5;
          this.square(
            cross.innerWidth + margin * 2,
            Math.abs(cross.elevations[Elevation.ground]) + margin,
            [-margin, -cross.elevations[Elevation.ground]]
          );
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: "building-ground",
        onUpdate: function (this: AppPolygon, cross: Cross) {
          const margin = 1.5;
          const level = Math.abs(cross.elevations[Elevation.ground]);
          const h = cross.crawlerHeight - level;
          this.square(cross.innerWidth + margin * 2, h + margin, [
            -margin,
            level,
          ]);
        },
      })
    );
    this.parts.push(
      new AppPolyline({
        selector: "building-ground-line",
        onUpdate: function (this: AppPolyline, cross: Cross) {
          const level = cross.elevations[Elevation.ground];
          this.points = [
            [-2, -level],
            [cross.innerWidth + 2, -level],
          ];
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: "building-crawler",
        onUpdate: function (this: AppPolygon, cross: Cross) {
          this.visible = cross.crawlerSpace;
          this.square(
            cross.innerWidth - cross.wallOuterThickness * 2,
            cross.crawlerHeight,
            [
              cross.wallOuterThickness,
              -cross.elevations[Elevation.crawlerCeiling],
            ]
          );
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: "building-walls",
        onUpdate: function (this: AppPolygon, cross: Cross) {
          this.square(
            cross.innerWidth,
            cross.elevations[Elevation.topFloor] -
              cross.elevations[Elevation.crawlerFloor],
            [0, -cross.elevations[Elevation.topFloor]]
          );
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: "building-room",
        onUpdate: function (this: AppPolygon, cross: Cross) {
          this.square(
            cross.innerWidth - cross.wallOuterThickness * 2,
            cross.ceilingHeight,
            [cross.wallOuterThickness, -cross.elevations[Elevation.ceiling]]
          );
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: "building-fill",
        onUpdate: function (this: AppPolygon, cross: Cross) {
          const roofWall =
            cross.viewedRoofStyle === RoofStyle.roof70
              ? cross.roof70Walls
              : cross.roofCircleWalls;
          const top = cross.elevations[Elevation.topFloor] + roofWall;
          this.square(
            cross.innerWidth,
            top - cross.elevations[Elevation.ground],
            [0, -top]
          );
        },
      })
    );

    this.parts.push(
      new AppPolygon({
        selector: "building-roof-70-wall1",
        onUpdate: function (this: AppPolygon, cross: Cross) {
          this.square(cross.wallOuterThickness, cross.roof70Walls, [
            0,
            -cross.elevations[Elevation.topFloor] - cross.roof70Walls,
          ]);
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: "building-roof-70-wall2",
        onUpdate: function (this: AppPolygon, cross: Cross) {
          this.square(cross.wallOuterThickness, cross.roof70Walls, [
            cross.innerWidth - cross.wallOuterThickness,
            -cross.elevations[Elevation.topFloor] - cross.roof70Walls,
          ]);
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: "building-roof-circle-wall1",
        onUpdate: function (this: AppPolygon, cross: Cross) {
          this.square(cross.wallOuterThickness, cross.roofCircleWalls, [
            cross.innerWidth - cross.wallOuterThickness,
            -cross.elevations[Elevation.topFloor] - cross.roofCircleWalls,
          ]);
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: "building-roof-circle-wall2",
        onUpdate: function (this: AppPolygon, cross: Cross) {
          this.square(cross.wallOuterThickness, cross.roofCircleWalls, [
            0,
            -cross.elevations[Elevation.topFloor] - cross.roofCircleWalls,
          ]);
        },
      })
    );
  }

  createHelpers() {
    this.parts.push(
      new Measure({
        selector: "minimum",
        floor: Floor.all,
        direction: 0,
        textRotate: 0,
        onUpdate: function (this: Measure, cross: Cross) {
          const level = cross.elevations[Elevation.topFloor];
          this.offsetPixels = -60;
          const i = cross.getIntersectionWithRoof(cross.minimumHeight);
          this.offsetMeters = -i[0];
          this.a = [+cross.wallOuterThickness, -level];
          this.b = [i[0], i[1]];
        },
      })
    );
    this.parts.push(
      new Measure({
        selector: "minimum-h",
        floor: Floor.all,
        direction: -90,
        textRotate: 0,
        onUpdate: function (this: Measure, cross: Cross) {
          const level = cross.elevations[Elevation.topFloor];
          this.offsetPixels = 0;
          const i = cross.getIntersectionWithRoof(cross.minimumHeight);
          this.offsetMeters = 1.5;
          this.a = [+cross.wallOuterThickness, -level];
          this.b = [i[0], i[1]];
        },
      })
    );
    this.parts.push(
      new Measure({
        selector: "minimum-room",
        floor: Floor.all,
        direction: 0,
        textRotate: 45,
        onUpdate: function (this: Measure, cross: Cross) {
          const level = cross.elevations[Elevation.topFloor];
          this.offsetPixels = 60;
          const i = cross.getIntersectionWithRoof(cross.minimumHeightRoom);
          this.offsetMeters = 0;
          const x = cross.innerWidth - i[0];
          this.a = [cross.innerWidth, -level];
          this.b = [x, i[1]];
        },
      })
    );
    this.parts.push(
      new Measure({
        selector: "minimum-room-h",
        floor: Floor.all,
        direction: -90,
        textRotate: 0,
        onUpdate: function (this: Measure, cross: Cross) {
          this.offsetPixels = 0;
          const level = cross.elevations[Elevation.topFloor];
          const i = cross.getIntersectionWithRoof(cross.minimumHeightRoom);
          this.offsetMeters = 1.5;
          const x = cross.innerWidth - i[0];
          this.a = [x, i[1]];
          this.b = [x + i[0] - cross.wallOuterThickness, -level];
        },
      })
    );

    this.parts.push(
      new Measure({
        selector: "lower-roof",
        floor: Floor.all,
        textRotate: 0,
        onUpdate: function (this: Measure, cross: Cross) {
          this.offsetPixels = 0;
          this.offsetMeters = 1.5;
          this.b = cross.roofPoints[RoofPoint.roofBendInside];
          this.a = cross.roofPoints[RoofPoint.roofWallInner];
          this.direction = angleBetween(this.a, this.b) + 90;
        },
      })
    );
    this.parts.push(
      new Measure({
        selector: "higher-roof",
        floor: Floor.all,
        textRotate: 0,
        onUpdate: function (this: Measure, cross: Cross) {
          this.offsetPixels = 0;
          this.offsetMeters = 1.5;
          this.a = cross.roofPoints[RoofPoint.roofBendInside];
          this.b = cross.roofPoints[RoofPoint.roofTopInside];
          this.direction = angleBetween(this.a, this.b) - 90;
        },
      })
    );
  }
  getIntersectionWithRoof(incomingLine: number): xy {
    const total: xy[] = [];
    const wall = [
      this.roofPoints[RoofPoint.roofFloor],
      this.roofPoints[RoofPoint.roofWallInner],
    ];
    const lower = [
      this.roofPoints[RoofPoint.roofWallInner],
      this.roofPoints[RoofPoint.roofBendInside],
    ];
    const higher = [
      this.roofPoints[RoofPoint.roofBendInside],
      this.roofPoints[RoofPoint.roofTopInside],
    ];
    [wall, lower, higher].forEach((line, i, arr) => {
      const xy = lineIntersect(line, [
        [-100, -(this.elevations[Elevation.topFloor] + incomingLine)],
        [100, -(this.elevations[Elevation.topFloor] + incomingLine)],
      ]);
      total.push(xy);
    });

    let farthest = total.sort((a, b) => b[0] - a[0])[0];
    // if (farthest[0] >= (this.innerWidth - this.wallOuterThickness) / 2) {
    //   return this.innerRoofContourLine[3];
    // }
    return farthest;
  }

  createCircleRoof() {
    this.parts.push(
      new AppPolygon({
        selector: "roof-circle-fill",
        onUpdate: function (this: AppPolygon, cross: Cross) {
          this.coords = [
            ...[0, 1, 2, 3, 4].map((i) =>
              cross.pointOnCircleRoof(Math.PI * -(i / 4), RoofType.outer)
            ),
          ].map((x) => {
            return [x[0], x[1] - cross.roofCircleWalls];
          });
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: "roof-circle-shadow",
        onUpdate: function (this: AppPolygon, cross: Cross) {
          this.coords = [
            ...[0, 1, 2, 3, 4].map((i) =>
              cross.pointOnCircleRoof(Math.PI * -(i / 4), RoofType.outer)
            ),
            ...[0, 1, 2, 3, 4]
              .map((i) =>
                cross.pointOnCircleRoof(Math.PI * -(i / 4), RoofType.inner)
              )
              .reverse(),
          ].map((x) => {
            return [x[0], x[1] - cross.roofCircleWalls];
          });
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: "roof-circle",
        onUpdate: function (this: AppPolygon, cross: Cross) {
          this.coords = [
            ...[0, 1, 2, 3, 4].map((i) =>
              cross.pointOnCircleRoof(Math.PI * -(i / 4), RoofType.outer)
            ),
            ...[0, 1, 2, 3, 4]
              .map((i) =>
                cross.pointOnCircleRoof(Math.PI * -(i / 4), RoofType.inner)
              )
              .reverse(),
          ].map((x) => {
            return [x[0], x[1] - cross.roofCircleWalls];
          });
        },
      })
    );
    this.parts.push(
      new AppPath({
        selector: "roof-circle__h-circle",
        lineThickness: 2,
        onUpdate: function (this: AppPath, cross: Cross) {
          const [x, y] = cross.pointOnCircleRoof(0, RoofType.outer);
          const extraRadius = x - cross.innerWidth;
          const radius = extraRadius * 2 + cross.innerWidth;

          this.d = `M${radius},0 a1,1 0 0,0 ${-radius},0`;
          this.transform = `translate(${-extraRadius} ${
            y - cross.roofCircleWalls
          })`;
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: "roof-circle__h-line",
        lineThickness: 2,
        onUpdate: function (this: AppPolygon, cross: Cross) {
          this.coords = [
            cross.pointOnCircleRoof(Math.PI * (-3 / 4), RoofType.sketch),
            [
              cross.roofCenter[0],
              cross.roofCenter[1] + cross.roofCirclePullDown,
            ],
            cross.pointOnCircleRoof(Math.PI, RoofType.outer), // left
            cross.pointOnCircleRoof(0, RoofType.outer), // right
            [
              cross.roofCenter[0],
              cross.roofCenter[1] + cross.roofCirclePullDown,
            ],
            cross.pointOnCircleRoof(Math.PI * (-1 / 4), RoofType.sketch),
          ].map(function (x) {
            return [x[0], x[1] - cross.roofCircleWalls];
          });
        },
      })
    );
  }

  create70Roof() {
    this.parts.push(
      new AppPolygon({
        selector: "roof-70-fill",
        onUpdate: function (this: AppPolygon, cross: Cross) {
          this.coords = cross.pointOfRoof().slice(0, 7);
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: "roof-70-shadow",
        onUpdate: function (this: AppPolygon, cross: Cross) {
          this.coords = cross.pointOfRoof(true);
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: "roof-70",
        onUpdate: function (this: AppPolygon, cross: Cross) {
          this.coords = cross.pointOfRoof();
        },
      })
    );
  }

  // Helpers

  pointOfRoof(extened = false): xy[] {
    const h70RoofThickness = this.roofThickness / Math.sin(degToRad(70));
    const hSetback = this.roofThickness / Math.tan(degToRad(70)); /// 18.20
    const lengthConnection = Math.sqrt(hSetback ** 2 + h70RoofThickness ** 2);

    const h30RoofThickness =
      this.roofThickness * Math.sin((30 * Math.PI) / 180);

    const half = this.innerWidth / 2;
    const h70 = this.roof70offset;
    const v70 = this.getAngle(70, h70) + this.roof70Walls;

    const x = this.angle(-40, lengthConnection);
    const h70i = h70 - x[0];
    const v70i = v70 + x[1];

    const h30 = half - h70;
    const h30i = h30 - h30RoofThickness;
    const v30 = this.getAngle(30, h30);
    const v30i = this.getAngle(30, h30i);
    const vMid = v30 + v70;
    const vMidi = v30i + v70i;
    return [
      // Outside left-to-right:
      this.angle(degToRad(180 - 70), this.roof70Extension, [
        0,
        -this.roof70Walls,
      ]),
      [0, -this.roof70Walls],
      [h70, -v70],
      [half, -vMid],
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
      [this.innerWidth - h70i, -v70i],
      [half, -vMidi],
      [h70i, -v70i],
      [h70RoofThickness, -this.roof70Walls],
      this.angle((110 * Math.PI) / 180, this.roof70Extension, [
        h70RoofThickness,
        -this.roof70Walls,
      ]),
    ].map(([x, y]) => [
      round(x),
      round(-this.elevations[Elevation.topFloor] + y),
    ]);
  }
  getAngle(deg: 70 | 30, size) {
    return size * Math.tan((deg * Math.PI) / 180);
  }

  pointOnCircleRoof(rad, roofType: RoofType): xy {
    let r;
    if (roofType === RoofType.outer) {
      r = this.innerWidth / 2 + this.roofCircleExtra;
    }
    if (roofType === RoofType.inner) {
      r = this.innerWidth / 2 - this.roofThickness + this.roofCircleExtra;
    }
    if (roofType === RoofType.sketch) {
      r = this.innerWidth / 2 + this.roofThickness * 1.5 + this.roofCircleExtra;
    }
    const coords = this.angle(rad, r);
    return [
      round(coords[0] + this.roofCenter[0]),
      round(coords[1] + this.roofCenter[1] + this.roofCirclePullDown),
    ];
  }

  angle(rad, r, offset = [0, 0]): xy {
    const x = r * Math.cos(rad);
    const y = r * Math.sin(rad);
    return [x + offset[0], y + offset[1]];
  }
}
