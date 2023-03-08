import { Cross } from "./cross.model";
import { lindeLund } from "./lindelund/lindeLund";
import { Room } from "../model/specific/room.model";
import { Wall, WallSide, WallType } from "../model/specific/wall.model";
import { AppPolyline } from "src/app/model/polyline.model";
import {
  angleXY,
  distanceBetweenPoints,
  offset,
  round,
  sum,
} from "src/app/shared/global-functions";
import * as d3 from "d3";
import { Floor, Graphic } from "../components/enum.data";
import { BaseSVG } from "src/app/model/base.model";
import { Stair } from "./stairs.model";
import { Measure } from "../model/specific/measure.model";
import { Windrose } from "../model/specific/windrose.model";
import { AppPolygon } from "../model/polygon.model";
import { Construction } from "./construction.model";
import { AppDistance } from "../model/distance.model";
import { AppSVG } from "../model/svg.model";
import { HouseUser } from "./house.model";
export type xy = [number, number];
export type xyz = [number, number, number];

export class House extends HouseUser {
  outerBase = undefined;
  extensionToNorth = undefined;
  extensionToSouth = undefined;
  extensionToWest = undefined;
  extensionToEast = undefined;
  houseWidth = undefined;
  houseLength = undefined;
  gridSizeY = undefined;
  gridSizeX = undefined;

  balconyEdge = -0.3;
  balconyDepth = 2.5;

  westRoomWidth = 4;
  midRoomExtended = true;
  eastRoomExtended = true;

  serverRoom: xy = [undefined, undefined];
  stramien: {
    in: StramienGroup;
    out: StramienGroup;
    ground: StramienGroup;
    top: StramienGroup;
  };
  partsFlatten: BaseSVG[];

  cross = new Cross();
  stair = new Stair();
  construction = new Construction();

  stats: any = {
    wall: {},
    floor: {},
  };

  tower: Tower = {
    show: undefined,
    innerCoords: undefined,
    outerCoords: undefined,
    outerWallOffset: undefined,
    width: undefined,
    houseIncrement: undefined,
    innerIncrement: undefined,
    outerIncrement: undefined,
    innerWallLength: undefined,
    outerWallLength: undefined,
    intersectionEast: undefined,
    intersectionWest: undefined,
    wallOuterThickness: undefined,
    footprintVisible: false,
  };

  constructor(house: HouseUser) {
    super();
    Object.assign(this, house);
    (window as any).house = this;

    // Main calculations
    this.calculateHouse();

    // Main logic
    this.linkParts();
    this.calculateStats();

    this.createStramien();
    this.createGrid();
    this.createMeasures();
    this.createExtra();
  }

  createExtra() {
    this.parts.push(new AppDistance());
    const part0 = new AppPolyline({
      selector: "balcony-edge",
      floor: Floor.ground,
      lineThickness: 1,
      dash: [1, 8],
      onUpdate: function (this: AppPolyline, house: House) {
        const s = house.stramien.in;
        const o = house.balconyWidth + house.balconyEdge;
        const point1: xy = [s.we.b, s.ns.b + o];
        const point2: xy = [s.we.c, s.ns.b + o];
        this.coords = [point1, point2];
      },
    });
    this.parts.push(part0);

    const part1 = new AppPolyline({
      selector: "hall-edge",
      floor: Floor.ground,
      lineThickness: 1,
      dash: [1, 8],
      onUpdate: function (this: AppPolyline, house: House) {
        const s = house.stramien.in;
        const w = house.stair.totalWidth - house.stair.walkWidth;
        const o = house.wallInnerThickness * 3 + 1 * 2;
        const point1: xy = [s.we.b, s.ns.b - o];
        const point2: xy = [s.we.b + w, s.ns.b - o];
        this.coords = [point1, point2];
      },
    });
    this.parts.push(part1);

    const part = new AppPolyline({
      selector: "view-lines",
      floor: Floor.ground,
      lineThickness: 3,
      onUpdate: function (this: AppPolyline, house: House) {
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
    });

    this.parts.push(part);
    const part2 = new AppPolygon({
      selector: "tower-walls",
      floor: Floor.all,
      onUpdate: function (this: AppPolygon, house: House) {
        this.visible = house.tower.footprintVisible;
        this.coords = [
          ...house.tower.innerCoords,
          house.tower.innerCoords[0],
          ...[...house.tower.outerCoords].reverse(), // make copy!
          house.tower.outerCoords[7],
        ];
      },
    });
    this.parts.push(part2);

    this.parts.push(
      new AppPolyline({
        selector: "roof-line-1",
        floor: Floor.top,
        lineThickness: 1,
        dash: [10, 10],
        onUpdate: function (this: AppPolyline, house: House) {
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
      })
    );
    this.parts.push(
      new AppPolyline({
        selector: "roof-line-2",
        floor: Floor.top,
        lineThickness: 1,
        dash: [10, 10],
        onUpdate: function (this: AppPolyline, house: House) {
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
      })
    );
    this.parts.push(
      new AppPolyline({
        selector: "roof-line-3",
        floor: Floor.top,
        lineThickness: 1,
        dash: [10, 10],
        onUpdate: function (this: AppPolyline, house: House) {
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
      })
    );
    this.parts.push(
      new AppPolyline({
        selector: "roof-line-4",
        floor: Floor.top,
        lineThickness: 1,
        dash: [10, 10],
        onUpdate: function (this: AppPolyline, house: House) {
          const s = house.stramien.in;
          const point1: xy = [s.we.d, s.ns.c];
          const point2: xy = [s.we.c, s.ns.c];
          this.coords = [
            offset(point1, [0, -house.cross.minimumHeightWidth]),
            offset(point2, [0, -house.cross.minimumHeightWidth]),
          ];
        },
      })
    );
    this.parts.push(
      new AppPolyline({
        selector: "roof-line-5",
        floor: Floor.top,
        lineThickness: 1,
        dash: [10, 10],
        onUpdate: function (this: AppPolyline, house: House) {
          const s = house.stramien.in;
          const point1: xy = [s.we.b, s.ns.c];
          const point2: xy = [s.we.a, s.ns.c];
          this.coords = [
            offset(point1, [0, -house.cross.minimumHeightWidth]),
            offset(point2, [0, -house.cross.minimumHeightWidth]),
          ];
        },
      })
    );
    //
  }

  // CHecked
  createMeasures() {
    this.parts.push(
      new Measure({
        selector: "house-total-width",
        floor: Floor.all,
        direction: 90,
        textRotate: 0,
        onUpdate: function (this: Measure, house: House) {
          const pushOff = house.houseLength + house.studDistance * 2;
          this.offsetPixels = 16;
          this.a = [house.stramien.out.we.a, pushOff];
          this.b = [house.stramien.out.we.d, pushOff];
        },
      })
    );

    for (let i = 0; i < 3; i++) {
      const letters = ["a", "b", "c", "d"];
      const letter = letters[i];
      this.parts.push(
        new Measure({
          selector: "house-width-" + (i + 1),
          floor: Floor.all,
          direction: 90,
          textRotate: 0,
          onUpdate: function (this: Measure, house: House) {
            const pushOff = house.houseLength + house.studDistance * 2;
            this.offsetPixels = 0;
            this.a = [house.stramien.out.we[letters[i + 0]], pushOff];
            this.b = [house.stramien.out.we[letters[i + 1]], pushOff];
          },
        })
      );
    }

    this.parts.push(
      new Measure({
        selector: "house-height-1",
        floor: Floor.all,
        direction: 0,
        textRotate: 0,
        onUpdate: function (this: Measure, house: House) {
          const pushOff = house.houseWidth + house.studDistance * 1;
          this.offsetPixels = 8;
          this.offsetMeters = house.studDistance;
          this.b = [pushOff, house.stramien.out.ns.a];
          this.a = [pushOff, house.stramien.out.ns.b];
        },
      })
    );
    this.parts.push(
      new Measure({
        selector: "house-height-inner",
        floor: Floor.all,
        direction: 180,
        textRotate: 0,
        onUpdate: function (this: Measure, house: House) {
          const pushOff = -house.studDistance * 1;
          this.offsetPixels = 8;
          this.offsetMeters = house.studDistance;
          this.b = [pushOff, house.stramien.in.ns.b];
          this.a = [pushOff, house.stramien.in.ns.c];
        },
      })
    );

    this.parts.push(
      new Measure({
        selector: "house-height-2",
        floor: Floor.all,
        direction: 0,
        textRotate: 0,
        onUpdate: function (this: Measure, house: House) {
          const pushOff = house.houseWidth + house.studDistance * 1;
          this.offsetPixels = 8;
          this.offsetMeters = house.studDistance;
          this.b = [pushOff, house.stramien.out.ns.b];
          this.a = [pushOff, house.stramien.out.ns.c];
        },
      })
    );
    this.parts.push(
      new Measure({
        selector: "house-height-3",
        floor: Floor.all,
        direction: 0,
        textRotate: 0,
        onUpdate: function (this: Measure, house: House) {
          const pushOff = house.houseWidth + house.studDistance * 1;
          this.offsetPixels = 8;
          this.offsetMeters = house.studDistance;
          this.b = [pushOff, house.stramien.out.ns.c];
          this.a = [pushOff, house.stramien.out.ns.d];
        },
      })
    );
    this.parts.push(
      new Measure({
        selector: "house-total-height",
        floor: Floor.all,
        direction: 0,
        textRotate: 0,
        onUpdate: function (this: Measure, house: House) {
          const pushOff = house.houseWidth + house.studDistance * 1;
          this.offsetPixels = 32;
          this.offsetMeters = house.studDistance;
          this.b = [pushOff, house.stramien.out.ns.a];
          this.a = [pushOff, house.stramien.out.ns.d];
        },
      })
    );
  }
  createStramien() {
    const margin = 3 * this.studDistance;

    const floor = (side: string): Floor => {
      if (side === "in") return Floor.all;
      if (side === "out") return Floor.all;
      if (side === "ground") return Floor.ground;
      if (side === "top") return Floor.top;
    };
    for (let side of ["in", "out", "ground", "top"]) {
      for (let d of ["we", "ns"]) {
        for (let i of Object.keys(Stramien)) {
          const id = `house-stramien-${side}-${d}-${i}`;
          if (d === "ns") {
            this.parts.push(
              new AppPolyline({
                floor: floor(side),
                selector: id,
                lineThickness: 1.5,
                onUpdate: function (this: AppPolyline, house: House) {
                  this.coords = [
                    [-margin, house.stramien[side][d][i]],
                    [house.houseWidth + margin, house.stramien[side][d][i]],
                  ];
                },
              })
            );
          } else {
            this.parts.push(
              new AppPolyline({
                floor: floor(side),
                selector: id,
                lineThickness: 1.5,
                onUpdate: function (this: AppPolyline, house: House) {
                  this.coords = [
                    [house.stramien[side][d][i], -margin],
                    [house.stramien[side][d][i], house.houseLength + margin],
                  ];
                },
              })
            );
          }
        }
      }
    }
  }
  createGrid() {
    const margin = this.studDistance * 3;
    const extra = 1;
    this.gridSizeY = Math.round(
      this.houseWidth / this.studDistance + extra * 2 + 1
    );
    for (let i = 0; i < 55; i++) {
      // vertical lines
      const main = [
        0,
        this.studAmountWest,
        this.studAmountWest + this.studAmount,
        this.studAmountWest + this.studAmount + this.studAmountEast,
      ].includes(i - extra);
      const id = `grid-index-${i}.grid-vertical`;
      const part = new AppPolyline({
        selector: id,
        lineThickness: main ? 0.8 : 0.6,
        index: i,
        floor: Floor.all,
        onUpdate: function (house: House) {
          const step = (i - extra) * house.studDistance;
          const length = house.houseLength;
          this.points =
            this.index < house.gridSizeY
              ? [
                  [step, -margin],
                  [step, length + margin],
                ]
              : [];
          this.classes = [
            main ? "grid-main" : (i - 1) % 5 ? "grid-sub" : "grid-subsub",
          ];
          // this.main = this.index % house.studAmount === 0;
        },
      });
      part.createSelector();
      this.parts.push(part);
    }
    this.gridSizeX = Math.round(
      this.houseLength / this.studDistance + extra * 2 + 1
    );
    for (let i = 0; i < 55; i++) {
      // horizontal lines

      const main = [
        0,
        this.studAmountNorth,
        this.studAmountNorth + this.studAmount,
        this.studAmountNorth + this.studAmount + this.studAmountSouth,
      ].includes(i - extra);

      const id = `grid-index-${i}.grid-horizontal`;
      this.parts.push(
        new AppPolyline({
          lineThickness: main ? 0.8 : 0.6,
          selector: id,
          index: i,
          floor: Floor.all,
          onUpdate: function (house: House) {
            const step = (i - extra) * house.studDistance;
            const length = house.houseWidth;
            this.points =
              this.index < house.gridSizeX
                ? [
                    [-margin, step],
                    [length + margin, step],
                  ]
                : [];
            this.classes = [
              main ? "grid-main" : (i - 1) % 5 ? "grid-sub" : "grid-subsub",
            ];
          },
        })
      );
    }

    this.parts[".house-wind-rose"] = new Windrose({
      rotate: 0,
      floor: Floor.all,
      parent: this,
      onUpdate: function (this: Windrose, house: House) {
        this.origin = [2, 0];
      },
    });
  }

  /** On startup link all, and calculate a start */
  linkParts() {
    // Parent, Calculate first, Create selector
    const load = (part: BaseSVG, parent) => {
      if (part === undefined) return;
      part.parent = parent;
      part.onUpdate(this);
      part.createSelector();
      if (part.parts) part.parts.forEach((x) => load(x, part));
      this.partsFlatten.push(part);
    };
    this.partsFlatten = [];
    this.parts.forEach((x) => load(x, this)); // rooms have house as parent
  }

  calculateTower() {
    this.tower.wallOuterThickness = this.wallOuterThickness;
    this.tower.outerWallOffset = round(
      this.tower.wallOuterThickness * Math.tan((22.5 * Math.PI) / 180)
    );
    this.tower.innerWallLength = this.towerWidth;
    this.tower.outerWallLength =
      this.tower.outerWallOffset * 2 + this.tower.innerWallLength;
    this.tower.show = this.showTower;
    this.tower.width = this.towerWidth; // no use
    this.tower.houseIncrement = round(
      this.tower.outerWallLength / Math.sqrt(2) + this.tower.outerWallLength
    );
  }

  /**Main calculations */
  calculateHouse() {
    this.outerBase = round(this.studAmount * this.studDistance); // 5.5m
    this.extensionToSouth = this.studAmountSouth * this.studDistance;
    this.extensionToNorth = this.studAmountNorth * this.studDistance;
    this.extensionToEast = this.studAmountEast * this.studDistance;
    this.extensionToWest = this.studAmountWest * this.studDistance;

    this.calculateTower();
    if (this.tower.show) {
      this.extensionToNorth = Math.max(
        this.extensionToNorth,
        Math.ceil(this.tower.houseIncrement)
      );
    } else {
      this.tower.houseIncrement = 0;
    }

    const inObj: StramienGroup = {
      we: {
        a: this.wallOuterThickness,
        b: this.extensionToWest + this.wallOuterThickness * 1,
        c:
          this.extensionToWest +
          this.outerBase * 1 +
          this.wallOuterThickness * -1,
        d:
          this.extensionToEast +
          this.outerBase +
          this.extensionToWest +
          this.wallOuterThickness * -1,
      },
      ns: {
        a: this.wallOuterThickness,
        b: this.extensionToNorth + this.wallOuterThickness * 1,
        c:
          this.extensionToNorth + this.outerBase + this.wallOuterThickness * -1,
        d:
          this.extensionToNorth +
          this.outerBase +
          this.extensionToSouth +
          this.wallOuterThickness * -1,
      },
    };

    const hallStramienWE =
      inObj.we.b + (this.stair.totalWidth - this.stair.walkWidth);
    const hallStramienNS = inObj.ns.b - 5;
    this.stramien = {
      in: inObj,
      out: {
        we: {
          a: inObj.we.a - this.wallOuterThickness,
          b: inObj.we.b - this.wallOuterThickness,
          c: inObj.we.c + this.wallOuterThickness,
          d: inObj.we.d + this.wallOuterThickness,
        },
        ns: {
          a: inObj.ns.a - this.wallOuterThickness,
          b: inObj.ns.b - this.wallOuterThickness,
          c: inObj.ns.c + this.wallOuterThickness,
          d: inObj.ns.d + this.wallOuterThickness,
        },
      },
      top: {
        we: {
          toilet: inObj.we.b + this.stair.totalWidth - this.stair.walkWidth,
          hall: inObj.we.b + this.stair.totalWidth + 1,
        },
        ns: {
          hall: hallStramienNS + 1.5,
          walkway: inObj.ns.b + 1 + 0.5,
        },
      },
      ground: {
        we: {
          hall: hallStramienWE,
        },
        ns: {
          hall: hallStramienNS,
        },
      },
    };
    this.stair.stairOrigin = [hallStramienNS, hallStramienWE];

    this.serverRoom = [
      this.stramien.in.we.c - 1,
      this.stramien.in.ns.b - this.wallInnerThickness,
    ];
    this.houseWidth = round(this.stramien.out.we.d - this.stramien.out.we.a);
    this.houseLength = round(this.stramien.out.ns.d - this.stramien.out.ns.a);

    this.calculateTowerCoords();

    // update

    this.cross.calculate(this);
    this.stair.calculate(this);
    this.construction.calculate(this);
  }
  calculateStats() {
    this.getWallLength();
    this.getWallArea();
    this.getFloorArea();
  }
  getWallLength() {
    this.stats.wall.innerLength = Math.ceil(
      sum(
        Object.values(this.partsFlatten)
          .filter((x) => x instanceof Wall)
          .map((x: Wall) => {
            if (x.type === WallType.outer) {
              return x.getLength(WallSide.in);
            }

            if (x.type === WallType.inner) {
              return x.getLength(WallSide.out) + x.getLength(WallSide.in);
            }
            return 0;
          })
      )
    );

    this.stats.wall.outerLength = Math.ceil(
      sum(
        Object.values(this.partsFlatten)
          .filter((x) => x instanceof Wall)
          .filter((x: Wall) => x.type === WallType.outer)
          .map((x: Wall) => x.getLength(WallSide.out)),
        1
      )
    );
  }
  getWallArea() {
    this.stats.wall.innerArea = Math.ceil(
      sum(
        Object.values(this.partsFlatten)
          .filter((x) => x instanceof Wall)
          .map((x: Wall) => {
            let l = 0;
            if (x.type === WallType.inner) l += x.getArea(WallSide.out);
            l += x.getArea(WallSide.in);
            return l;
          })
      )
    );

    this.stats.wall.outerArea = Math.ceil(
      sum(
        Object.values(this.partsFlatten)
          .filter((x) => x instanceof Wall)
          .filter((x: Wall) => x.type === WallType.outer)
          .map((x: Wall) => x.getArea(WallSide.out)),
        1
      )
    );
  }
  getFloorArea() {
    let total: { [key in Floor]?: { area: number; volume: number } } = {};
    Object.keys(Floor).map((f) => {
      total[f] = { area: 0, volume: 0 };
    });

    this.partsFlatten
      .filter((x) => x instanceof Room)
      .filter((x: Room) => x.name !== "innerFootprint")
      .filter((x: Room) => !x.hole)
      .forEach((room: Room) => {
        total[room.floor].area += room.area();
        total[room.floor].volume += room.volume();
        total[Floor.all].area += room.area();
        total[Floor.all].volume += room.volume();
      });

    Object.keys(Floor).map((f) => {
      total[f] = {
        area: round(total[f].area, 0),
        volume: round(total[f].volume, 0),
      };
    });
    this.stats.floor = total;
  }
  calculateTowerCoords() {
    if (this.tower.show === false) {
      this.tower.width = 0;
      this.tower.outerWallOffset = 0;
      this.tower.innerWallLength = 0;
      this.tower.outerWallLength = 0;
      this.tower.houseIncrement = 0;
      this.tower.wallOuterThickness = 0;
    }

    let cornerLength =
      this.tower.wallOuterThickness / Math.cos((22.5 * Math.PI) / 180); // checked
    this.tower.innerIncrement = Math.sqrt(this.tower.innerWallLength ** 2 / 2);
    this.tower.outerIncrement = Math.sqrt(this.tower.outerWallLength ** 2 / 2);

    const start: xy = [
      this.stramien.out.we.c + this.tower.outerWallOffset,
      this.stramien.out.ns.b -
        this.tower.innerIncrement -
        this.tower.innerWallLength -
        this.tower.outerWallOffset,
    ];

    const coord1 = start;
    const coord2 = offset(start, [this.tower.width, 0]);
    const coord3 = angleXY(45, this.tower.width, coord2);
    const coord4 = offset(coord3, [0, this.tower.width]);
    const coord5 = angleXY(45 + 90, this.tower.width, coord4);
    const coord6 = offset(coord5, [-this.tower.width, 0]);
    const coord7 = angleXY(45 + 180, this.tower.width, coord6);
    const coord8 = offset(coord7, [0, -this.tower.width]);
    this.tower.innerCoords = [
      coord1,
      coord2,
      coord3,
      coord4,
      coord5,
      coord6,
      coord7,
      coord8,
    ];
    this.tower.outerCoords = [
      angleXY(22.5 - 45 * 3, cornerLength, coord1),
      angleXY(22.5 - 45 * 2, cornerLength, coord2),
      angleXY(22.5 - 45 * 1, cornerLength, coord3),
      angleXY(22.5 - 45 * 0, cornerLength, coord4),
      angleXY(22.5 - 45 * -1, cornerLength, coord5),
      angleXY(22.5 - 45 * -2, cornerLength, coord6),
      angleXY(22.5 - 45 * -3, cornerLength, coord7),
      angleXY(22.5 - 45 * -4, cornerLength, coord8),
    ];

    this.tower.intersectionWest = offset(this.tower.outerCoords[0], [
      -this.tower.wallOuterThickness,
      this.tower.wallOuterThickness,
    ]);

    this.tower.intersectionEast = offset(this.tower.outerCoords[3], [
      -this.tower.wallOuterThickness,
      this.tower.wallOuterThickness,
    ]);

    if (this.tower.show === false) {
      this.tower.intersectionWest = [
        this.stramien.in.we.c,
        this.stramien.in.ns.b,
      ];
      this.tower.intersectionEast = [
        this.stramien.in.we.c,
        this.stramien.in.ns.b,
      ];
      this.tower.innerCoords = [...Array(8).keys()].map((x) => [
        this.stramien.in.we.c,
        this.stramien.in.ns.b,
      ]);
      this.tower.outerCoords = [...Array(8).keys()].map((x) => [
        this.stramien.out.we.c,
        this.stramien.out.ns.b,
      ]);
    }
  }

  /* Main draw function, which loops through parts */
  redrawHouse(
    floor: Floor,
    graphic: Graphic,
    meterPerPixel: number,
    redrawAll
  ) {
    // console.log("redrawHouse:", redrawAll);

    const loop = (theme, parent) => {
      parent.parts.forEach(async (part: BaseSVG) => {
        if (part === undefined) return;

        await part.update(theme, floor, meterPerPixel, redrawAll);
        if (part.parts !== undefined) loop(theme, part);
      });
    };

    if (graphic === Graphic.house2D) {
      loop(this, this);
      loop(this.stair, this.stair);
    }
    if (graphic === Graphic.cross) {
      loop(this.cross, this.cross);
    }

    if ([Graphic.stairCross, Graphic.stairPlan].includes(graphic)) {
      loop(this.stair, this.stair);
    }
  }
}
