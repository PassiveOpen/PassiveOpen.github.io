import { Floor } from "src/app/components/enum.data";
import { Other } from "src/app/house-parts/other.model";
import { House, HousePart, xy } from "../house.model";
import { offset } from "src/app/shared/global-functions";
import { PolygonSVG } from "src/app/house-parts/svg-other/polygon.svg";
import { PolylineSVG } from "src/app/house-parts/svg-other/polyline.svg";

export const lindelundOther = [
  new Other<PolygonSVG>({
    type: "polygon",
    housePart: HousePart.other,
    selector: "balcony-edge",
    floor: Floor.ground,
    dataSVG: {
      lineThickness: 1,
      dash: [1, 8],
    },
    onUpdate: function (this: Other<PolygonSVG>, house: House) {
      const s = house.stramien.in;
      const o = house.balconyWidth + house.balconyEdge;
      const point1: xy = [s.we.b, s.ns.b + o];
      const point2: xy = [s.we.c, s.ns.b + o];
      this.coords = [point1, point2];
    },
  }),

  new Other<PolygonSVG>({
    type: "polygon",
    housePart: HousePart.other,
    selector: "hall-edge",
    floor: Floor.ground,
    dataSVG: {
      lineThickness: 1,
      dash: [1, 8],
    },
    onUpdate: function (this: Other<PolygonSVG>, house: House) {
      const s = house.stramien.in;
      const w = house.stair.totalWidth - house.stair.walkWidth;
      const o = house.wallInnerThickness * 3 + 1 * 2;
      const point1: xy = [s.we.b, s.ns.b - o];
      const point2: xy = [s.we.b + w, s.ns.b - o];
      this.coords = [point1, point2];
    },
  }),

  new Other<PolylineSVG>({
    type: "polyline",
    housePart: HousePart.other,
    //todo repair
    selector: "view-lines",
    floor: Floor.ground,
    dataSVG: {
      lineThickness: 3,
    },
    onUpdate: function (this: Other<PolylineSVG>, house: House) {
      const s = house.stramien.in;
      const o = house.studDistance * 3;
      const we = s.we.b + 1;
      const ns = s.ns.b + (s.ns.c - s.ns.b) / 2;
      const pointN: xy = [we, house.stair.stairOrigin[1]];
      const pointS: xy = [we, s.ns.d + o];
      const pointW: xy = [s.we.a - o, ns];
      const pointE: xy = [s.we.d + o, ns];
      const central: xy = [we, ns];

      this.coords = [pointN, pointS, central, pointW, pointE];
    },
  }),

  new Other<PolygonSVG>({
    type: "polygon",
    housePart: HousePart.other,
    selector: "tower-walls",
    floor: Floor.all,
    dataSVG: {},
    onUpdate: function (this: Other<PolygonSVG>, house: House) {
      this.coords = [
        ...house.tower.innerCoords,
        house.tower.innerCoords[0],
        ...[...house.tower.outerCoords].reverse(), // make copy!
        house.tower.outerCoords[7],
      ];
    },
  }),

  new Other<PolylineSVG>({
    type: "polyline",
    housePart: HousePart.other,
    selector: "roof-line-1",
    floor: Floor.top,
    dataSVG: {
      lineThickness: 1,
      dash: [10, 10],
    },
    onUpdate: function (this: Other<PolylineSVG>, house: House) {
      const s = house.stramien.in;
      const point1: xy = [s.we.a, s.ns.b];
      const point2: xy = [s.we.b, s.ns.b];
      const point3: xy = [s.we.b, s.ns.a];
      this.coords = [
        offset(point1, [0, house.cross.minimumHeightWidth]),
        offset(point2, [
          house.cross.minimumHeightWidth,
          house.cross.minimumHeightWidth,
        ]),
        offset(point3, [house.cross.minimumHeightWidth, 0]),
      ];
    },
  }),
  new Other<PolylineSVG>({
    type: "polyline",
    housePart: HousePart.other,
    selector: "roof-line-2",
    floor: Floor.top,
    dataSVG: {
      lineThickness: 1,
      dash: [10, 10],
    },
    onUpdate: function (this: Other<PolylineSVG>, house: House) {
      const s = house.stramien.in;
      const point1: xy = [s.we.c, s.ns.a];
      const point2: xy = house.tower.show
        ? [
            s.we.c,
            s.ns.b -
              house.tower.houseIncrement -
              house.cross.minimumHeightWidth,
          ]
        : [s.we.c, s.ns.b];
      this.coords = [
        offset(point1, [-house.cross.minimumHeightWidth, 0]),
        offset(point2, [
          -house.cross.minimumHeightWidth,
          house.cross.minimumHeightWidth,
        ]),
      ];
    },
  }),
  new Other<PolylineSVG>({
    type: "polyline",
    housePart: HousePart.other,
    selector: "roof-line-3",
    floor: Floor.top,
    dataSVG: {
      lineThickness: 1,
      dash: [10, 10],
    },
    onUpdate: function (this: Other<PolylineSVG>, house: House) {
      const s = house.stramien.in;
      const point1: xy = house.tower.show
        ? [
            s.we.c +
              house.tower.houseIncrement +
              house.cross.minimumHeightWidth,
            s.ns.b,
          ]
        : [s.we.c, s.ns.b];
      const point2: xy = [s.we.d, s.ns.b];
      this.coords = [
        offset(point1, [
          -house.cross.minimumHeightWidth,
          house.cross.minimumHeightWidth,
        ]),
        offset(point2, [0, house.cross.minimumHeightWidth]),
      ];
    },
  }),
  new Other<PolylineSVG>({
    type: "polyline",
    housePart: HousePart.other,
    selector: "roof-line-4",
    floor: Floor.top,
    dataSVG: {
      lineThickness: 1,
      dash: [10, 10],
    },
    onUpdate: function (this: Other<PolylineSVG>, house: House) {
      const s = house.stramien.in;
      const point1: xy = [s.we.d, s.ns.c];
      const point2: xy = [s.we.c, s.ns.c];
      this.coords = [
        offset(point1, [0, -house.cross.minimumHeightWidth]),
        offset(point2, [0, -house.cross.minimumHeightWidth]),
      ];
    },
  }),
  new Other<PolylineSVG>({
    type: "polyline",
    housePart: HousePart.other,
    selector: "roof-line-5",
    floor: Floor.top,
    dataSVG: {
      lineThickness: 1,
      dash: [10, 10],
    },
    onUpdate: function (this: Other<PolylineSVG>, house: House) {
      const s = house.stramien.in;
      const point1: xy = [s.we.b, s.ns.c];
      const point2: xy = [s.we.a, s.ns.c];
      this.coords = [
        offset(point1, [0, -house.cross.minimumHeightWidth]),
        offset(point2, [0, -house.cross.minimumHeightWidth]),
      ];
    },
  }),
];
