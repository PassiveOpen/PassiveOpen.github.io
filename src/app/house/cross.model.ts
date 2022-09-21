import { AppPolygon } from '../model/polygon.model';
import { House, xy } from './house.model';
import { AppPolyline } from '../model/polyline.model';
import { AppPath } from 'src/app/model/path.model';
import { BaseSVG } from '../model/base.model';
import {
  angleXY,
  lineIntersect,
  offset,
  round,
} from '../shared/global-functions';
import { Measure } from '../model/specific/measure.model';
import { Floor, Tag } from '../components/enum.data';
export enum RoofType {
  outer = 'outer',
  inner = 'inner',
  sketch = 'sketch',
  shadow = 'shadow',
}
export enum RoofStyle {
  roof70 = 'roof70',
  roofCircle = 'roofCircle',
  roofCircleAnd70 = 'roofCircleAnd70',
}
export class Cross {
  house: House;
  // Inputs
  innerWidth = -1;
  wallOuterThickness = -1;
  roofThickness = 0.5;

  ceilingHeight = 3.3;
  floorAboveGround = 0.7;
  crawlerSpace = true;
  floorThickness = 0.5;

  center = [];
  roofCirclePullDown = 1;
  roofCircleExtra = -1;
  roofCircleWalls = 1;
  roof70offset = 0.6;
  roof70Extension = 1.2;
  roof70Walls = 1.4;

  bendPoint = [-1, -1];
  bendPointInner = [-1, -1];

  // Elevation heights
  roofTop = -1;
  crawlerHeight = -1;
  groundFloorTop = -1;
  groundFloorBottom = -1;
  topFloorTop = -1;
  topFloorBottom = -1;
  groundElevation = -1;
  houseHeight = -1;

  outerWallHeight = -1;
  gableWallArea = -1;

  minimumHeight = 1.5;
  minimumHeightWidth = -1;
  minimumHeightRoom = 2.3;
  minimumHeightRoomWidth = -1;

  roofStyle: RoofStyle = RoofStyle.roof70;
  viewedRoofStyle: RoofStyle = RoofStyle.roof70;
  parts: BaseSVG[] = [];

  innerRoofContourLine: xy[];

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
        selector: 'clip-roof',
        name: '#clip-roof',
        onUpdate: function (cross: Cross) {
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
    this.center = [this.house.outerBase / 2, 0];
    this.roofCircleExtra =
      round(
        Math.cos((65 * Math.PI) / 180) * this.roofCirclePullDown,3
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

    this.topFloorTop = 0;
    this.topFloorBottom = this.topFloorTop + -this.floorThickness;
    this.groundFloorTop = this.topFloorBottom - this.ceilingHeight;
    this.groundFloorBottom = this.groundFloorTop - this.floorThickness;
    this.groundElevation =
      this.groundFloorTop - (this.crawlerSpace ? this.floorAboveGround : 0);
    this.crawlerHeight = this.crawlerSpace ? 0.9 : 0;

    this.roofTop = this.topFloorTop + (this.roof70Walls + 2);
    this.houseHeight = round(this.roofTop - this.groundElevation);
    this.roofInnerContourLine();

    this.gableWallArea = 10; // ToDo
    this.outerWallHeight = Math.abs(this.groundElevation); // ToDo

    this.minimumHeightWidth = round(
      this.getIntersectionWithRoof(this.minimumHeight)[0]
    );
    this.minimumHeightRoomWidth = round(
      this.getIntersectionWithRoof(this.minimumHeightRoom)[0]
    );
  }

  createBuilding() {
    this.parts.push(
      new AppPolygon({
        selector: 'building-ground-fill',
        onUpdate: function (cross: Cross) {
          this.coords = [
            [-2, -cross.groundElevation],
            [cross.innerWidth + 2, -cross.groundElevation],
            [cross.innerWidth + 2, -cross.groundElevation + 2],
            [-2, -cross.groundElevation + 2],
          ];
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: 'building-ground',
        onUpdate: function (cross: Cross) {
          this.coords = [
            [-2, -cross.groundElevation],
            [cross.innerWidth + 2, -cross.groundElevation],
            [cross.innerWidth + 2, -cross.groundElevation + 2],
            [-2, -cross.groundElevation + 2],
          ];
        },
      })
    );
    this.parts.push(
      new AppPolyline({
        selector: 'building-ground-line',
        onUpdate: function (cross: Cross) {
          this.points = [
            [-2, -cross.groundElevation],
            [cross.innerWidth + 2, -cross.groundElevation],
          ];
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: 'building-crawler',
        onUpdate: function (cross: Cross) {
          const [w, h] = [
            cross.innerWidth - cross.wallOuterThickness * 2,
            cross.crawlerHeight,
          ];
          const origin = [cross.wallOuterThickness, -cross.groundFloorBottom];

          this.coords = [
            [origin[0], origin[1]],
            [origin[0] + w, origin[1]],
            [origin[0] + w, origin[1] + h],
            [origin[0], origin[1] + h],
          ];
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: 'building-walls',
        onUpdate: function (cross: Cross) {
          const [w, h] = [
            cross.innerWidth,
            -(cross.groundFloorBottom - cross.crawlerHeight),
          ];
          const origin = [0, -cross.topFloorTop];

          this.coords = [
            [origin[0], origin[1]],
            [origin[0] + w, origin[1]],
            [origin[0] + w, origin[1] + h],
            [origin[0], origin[1] + h],
          ];
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: 'building-room',
        onUpdate: function (cross: Cross) {
          this.coords = [
            [cross.wallOuterThickness, -cross.topFloorBottom],
            [
              cross.innerWidth - cross.wallOuterThickness,
              -cross.topFloorBottom,
            ],
            [
              cross.innerWidth - cross.wallOuterThickness,
              -cross.groundFloorTop,
            ],
            [cross.wallOuterThickness, -cross.groundFloorTop],
          ];
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: 'building-fill',
        onUpdate: function (cross: Cross) {
          const roofWall =
            cross.viewedRoofStyle === RoofStyle.roof70
              ? cross.roof70Walls
              : cross.roofCircleWalls;
          const [w, h] = [
            cross.innerWidth,
            -(cross.groundElevation - roofWall),
          ];
          const origin = [0, -roofWall];

          this.coords = [
            [origin[0], origin[1]],
            [origin[0] + w, origin[1]],
            [origin[0] + w, origin[1] + h],
            [origin[0], origin[1] + h],
          ];
        },
      })
    );

    this.parts.push(
      new AppPolygon({
        selector: 'building-roof-70-wall1',
        onUpdate: function (cross: Cross) {
          this.coords = [
            [0, -cross.roof70Walls],
            [cross.wallOuterThickness, -cross.roof70Walls],
            [cross.wallOuterThickness, 0],
            [0, 0],
          ];
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: 'building-roof-70-wall2',
        onUpdate: function (cross: Cross) {
          this.coords = [
            [cross.innerWidth, -cross.roof70Walls],
            [cross.innerWidth - cross.wallOuterThickness, -cross.roof70Walls],
            [cross.innerWidth - cross.wallOuterThickness, 0],
            [cross.innerWidth, 0],
          ];
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: 'building-roof-circle-wall1',
        onUpdate: function (cross: Cross) {
          this.coords = [
            [0, -cross.roofCircleWalls],
            [cross.wallOuterThickness, -cross.roofCircleWalls],
            [cross.wallOuterThickness, 0],
            [0, 0],
          ];
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: 'building-roof-circle-wall2',
        onUpdate: function (cross: Cross) {
          this.coords = [
            [cross.innerWidth, -cross.roofCircleWalls],
            [
              cross.innerWidth - cross.wallOuterThickness,
              -cross.roofCircleWalls,
            ],
            [cross.innerWidth - cross.wallOuterThickness, 0],
            [cross.innerWidth, 0],
          ];
        },
      })
    );
  }

  createHelpers() {
    this.parts.push(
      new Measure({
        selector: 'minimum',
        floor: Floor.all,
        direction: 0,
        textRotate: 0,
        onUpdate: function (this: Measure, cross: Cross) {
          this.offsetPixels = -60;
          const i = cross.getIntersectionWithRoof(cross.minimumHeight);
          this.offsetMeters = -i[0];
          this.a = [i[0] + cross.wallOuterThickness, 0];
          this.b = [i[0] + cross.wallOuterThickness, -i[1]];
        },
      })
    );
    this.parts.push(
      new Measure({
        selector: 'minimum-h',
        floor: Floor.all,
        direction: -90,
        textRotate: 0,
        onUpdate: function (this: Measure, cross: Cross) {
          this.offsetPixels = 0;
          const i = cross.getIntersectionWithRoof(cross.minimumHeight);
          this.offsetMeters = 1.5;
          this.a = [+cross.wallOuterThickness, 0];
          this.b = [i[0] + cross.wallOuterThickness, -i[1]];
        },
      })
    );
    this.parts.push(
      new Measure({
        selector: 'minimum-room',
        floor: Floor.all,
        direction: 0,
        textRotate: 0,
        onUpdate: function (this: Measure, cross: Cross) {
          this.offsetPixels = 60;
          const i = cross.getIntersectionWithRoof(cross.minimumHeightRoom);
          this.offsetMeters = i[0];
          const x = cross.innerWidth - i[0] - cross.wallOuterThickness;

          this.a = [x, 0];
          this.b = [x, -i[1]];
        },
      })
    );
    this.parts.push(
      new Measure({
        selector: 'minimum-room-h',
        floor: Floor.all,
        direction: -90,
        textRotate: 0,
        onUpdate: function (this: Measure, cross: Cross) {
          this.offsetPixels = 0;
          const i = cross.getIntersectionWithRoof(cross.minimumHeightRoom);
          this.offsetMeters = 1.5;
          const x = cross.innerWidth - i[0] - cross.wallOuterThickness;
          this.a = [x, -i[1]];
          this.b = [x + i[0], 0];
        },
      })
    );
  }
  getIntersectionWithRoof(incomingLine: number): xy {
    const total: xy[] = [];
    this.innerRoofContourLine.forEach((p, i, arr) => {
      if (i + 1 === arr.length) return;
      const line = [p, arr[i + 1]];

      const xy = lineIntersect(line, [
        [-100, incomingLine],
        [100, incomingLine],
      ]);
      total.push(xy);
    });
    let farthest = total.sort((a, b) => b[0] - a[0])[0];
    if (farthest[0] >= (this.innerWidth - this.wallOuterThickness) / 2) {
      return this.innerRoofContourLine[3];
    }
    return farthest;
  }

  createCircleRoof() {
    this.parts.push(
      new AppPolygon({
        selector: 'roof-circle-fill',
        onUpdate: function (cross: Cross) {
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
        selector: 'roof-circle-shadow',
        onUpdate: function (cross: Cross) {
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
        selector: 'roof-circle',
        onUpdate: function (cross: Cross) {
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
        selector: 'roof-circle__h-circle',
        lineThickness: 2,
        onUpdate: function (cross: Cross) {
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
        selector: 'roof-circle__h-line',
        lineThickness: 2,
        onUpdate: function (cross: Cross) {
          this.coords = [
            cross.pointOnCircleRoof(Math.PI * (-3 / 4), RoofType.sketch),
            [cross.center[0], cross.center[1] + cross.roofCirclePullDown],
            cross.pointOnCircleRoof(Math.PI, RoofType.outer), // left
            cross.pointOnCircleRoof(0, RoofType.outer), // right
            [cross.center[0], cross.center[1] + cross.roofCirclePullDown],
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
        selector: 'roof-70-fill',
        onUpdate: function (cross: Cross) {
          this.coords = cross.pointOfRoof().slice(0, 7);
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: 'roof-70-shadow',
        onUpdate: function (cross: Cross) {
          this.coords = cross.pointOfRoof(true);
        },
      })
    );
    this.parts.push(
      new AppPolygon({
        selector: 'roof-70',
        onUpdate: function (cross: Cross) {
          this.coords = cross.pointOfRoof();
        },
      })
    );
  }

  roofInnerContourLine() {
    const roof70 = this.pointOfRoof();
    const is70 = this.viewedRoofStyle === RoofStyle.roof70;

    const fictiveAirPoint: xy = [this.wallOuterThickness, this.topFloorTop - 3];
    const startFloor: xy = [this.wallOuterThickness, this.topFloorTop];
    const roofWall = is70 ? -this.roof70Walls : -this.roofCircleWalls;
    const tempEndOfRoof: xy = is70
      ? roof70[13]
      : offset(this.pointOnCircleRoof(Math.PI * -(4 / 4), RoofType.inner), [
          0,
          roofWall,
        ]);
    const bendInRoof: xy = is70
      ? roof70[11]
      : offset(this.pointOnCircleRoof(Math.PI * -(3 / 4), RoofType.inner), [
          0,
          roofWall,
        ]);
    const roofTop: xy = is70
      ? roof70[10]
      : offset(this.pointOnCircleRoof(Math.PI * -(2 / 4), RoofType.inner), [
          0,
          roofWall,
        ]);

    const roofBend = lineIntersect(
      [startFloor, fictiveAirPoint],
      [tempEndOfRoof, bendInRoof]
    );
    this.innerRoofContourLine = [startFloor, roofBend, bendInRoof, roofTop].map(
      (point) => {
        const xy = offset(point, [-this.wallOuterThickness, 0]).map((x) =>
          Math.abs(round(x))
        );

        return xy as xy;
      }
    );
  }

  // Helpers

  pointOfRoof(extened = false): xy[] {
    const h70RoofTickeness =
      this.roofThickness / Math.sin((70 * Math.PI) / 180);
    const hSetback = 0.5 / Math.tan((70 * Math.PI) / 180); /// 18.20
    const lengthConnection = Math.sqrt(hSetback ** 2 + h70RoofTickeness ** 2);

    const h30RoofTickeness =
      this.roofThickness * Math.sin((30 * Math.PI) / 180);

    const half = this.innerWidth / 2;
    const h70 = this.roof70offset;
    const v70 = this.getAngle(70, h70) + this.roof70Walls;

    const x = this.angle(-40, lengthConnection);
    const h70i = h70 - x[0];
    const v70i = v70 + x[1];

    const h30 = half - h70;
    const h30i = h30 - h30RoofTickeness;
    const v30 = this.getAngle(30, h30);
    const v30i = this.getAngle(30, h30i);
    const vMid = v30 + v70;
    const vMidi = v30i + v70i;
    return [
      this.angle((110 * Math.PI) / 180, this.roof70Extension, [
        0,
        -this.roof70Walls,
      ]),
      [0, -this.roof70Walls],
      [h70, -v70],
      [half, -vMid],
      [this.innerWidth - h70, -v70],
      [this.innerWidth, -this.roof70Walls],
      this.angle((70 * Math.PI) / 180, this.roof70Extension, [
        this.innerWidth,
        -this.roof70Walls,
      ]),
      this.angle((70 * Math.PI) / 180, this.roof70Extension, [
        this.innerWidth - h70RoofTickeness,
        -this.roof70Walls,
      ]),
      [this.innerWidth - h70RoofTickeness, -this.roof70Walls],
      [this.innerWidth - h70i, -v70i],
      [half, -vMidi],
      [h70i, -v70i],
      [h70RoofTickeness, -this.roof70Walls],
      this.angle((110 * Math.PI) / 180, this.roof70Extension, [
        h70RoofTickeness,
        -this.roof70Walls,
      ]),
    ];
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
      coords[0] + this.center[0],
      coords[1] + this.center[1] + this.roofCirclePullDown,
    ];
  }
  angle(rad, r, offset = [0, 0]): xy {
    const x = r * Math.cos(rad);
    const y = r * Math.sin(rad);
    return [x + offset[0], y + offset[1]];
  }
}
