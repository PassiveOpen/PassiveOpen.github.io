import { Injectable, OnInit } from "@angular/core";
import { BehaviorSubject, combineLatest, merge, Subject } from "rxjs";
import { House, HouseUser, xy } from "./house.model";
import * as d3 from "d3";
import { lindeLund } from "./lindelund/lindeLund";
import { Wall, WallSide, WallType } from "../house-parts/wall.model";
import { Floor, SensorType, State, Tag } from "../components/enum.data";
import { AppService } from "../app.service";
import { BaseSVG } from "../model/base.model";
import { Room } from "../house-parts/room.model";
import { Door } from "../house-parts/door.model";
import { Sensor } from "../model/specific/sensors/sensor.model";
import { Window } from "../house-parts/window.model";
import {
  angleXY,
  centerBetweenPoints,
  offset,
  rotateXY,
  round,
  sum,
} from "../shared/global-functions";
import { generateUUID } from "three/src/math/MathUtils";
import { Cost, GroupRow } from "./cost.model";
import { Measure } from "../house-parts/measure.model";
import { AppSVG } from "../model/svg.model";
import { fromLonLat } from "ol/proj";
import {
  LineString,
  MultiLineString,
  MultiPoint,
  Point,
  Polygon,
} from "ol/geom";
import { TurfService } from "../pages/page-map/openlayers/turf.service";
import { CookieService } from "ngx-cookie-service";
import { Coordinate } from "ol/coordinate";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Feature from "ol/Feature";

@Injectable({
  providedIn: "root",
})
export class HouseService {
  cookieKey = "house";
  house$ = new BehaviorSubject(this.getStore(lindeLund));
  timeout;

  roomKeys = this.house$.value.houseParts.rooms.map((x) => x.selector);
  wallKeys = this.house$.value.houseParts.walls.map((x) => x.selector);

  // doorKeys = [];
  doorKeys = this.house$.value.partsFlatten
    .filter((x) => x instanceof Door)
    .map((x) => x.selector);

  // windowKeys = [];
  windowKeys = this.house$.value.partsFlatten
    .filter((x) => x instanceof Window)
    .map((x) => x.selector);

  // sensorKeys = [];
  sensorKeys = this.house$.value.partsFlatten
    .filter((x) => x instanceof Sensor)
    .map((x) => x.selector)
    .sort((a, b) => a.localeCompare(b));

  exampleKeys = this.house$.value.partsFlatten
    .filter((x) => x instanceof AppSVG)
    .map((x) => x.selector)
    .sort((a, b) => a.localeCompare(b));

  constructor(
    private appService: AppService,
    private turfService: TurfService,
    private cookieService: CookieService
  ) {
    this.house$.subscribe((house) => {
      this.setStore();
    });
  }

  getStore(standard: HouseUser) {
    const cookie = this.cookieService.get(this.cookieKey);
    if (cookie === "") return new House(standard);

    const cookieStr = JSON.parse(cookie) as HouseUser;

    const storedHome = { ...standard };
    Object.keys(lindeLund).forEach((key) => {
      if (key === "parts") {
      } else if (key === "orientation") {
        storedHome[key].lat = cookieStr[key].lat;
        storedHome[key].lng = cookieStr[key].lng;
        storedHome[key].rotation = cookieStr[key].rotation;
      } else if (key === "garage") {
        storedHome[key].width = cookieStr[key].width;
        storedHome[key].length = cookieStr[key].length;
        storedHome[key].orientation = cookieStr[key].orientation;
      } else {
        storedHome[key] = cookieStr[key];
      }
    });
    // debug = obj.studAmount

    const house = new House(storedHome);
    return house;
  }

  setStore(): void {
    let obj: Partial<HouseUser> = {};
    Object.keys(lindeLund).forEach((key) => {
      if (key === "parts") return;
      obj[key] = this.house$.value[key];
    });
    this.cookieService.set(this.cookieKey, JSON.stringify(obj));
  }

  /**
   * Updates after a value change.
   */
  update(
    parent: "cross" | "stair" | "house" | "construction" | "roof" = "house",
    key,
    value,
    tag: Tag = undefined
  ) {
    // console.log("updates");

    const house: House = this.house$.value;

    if (parent === "house") {
      house[key] = value;
    }
    if (parent === "stair") {
      house.stair[key] = value;
    }
    if (parent === "cross") {
      house.cross[key] = value;
    }
    if (parent === "construction") {
      house.construction[key] = value;
    }
    if (parent === "roof") {
      house.cross.roof[key] = value;
    }
    house.calculateHouse();
    house.calculateStats();
    this.house$.next(house);

    if (tag === undefined) {
      return;
    }
    this.appService.tag$.next(tag);
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.appService.tag$.next(undefined);
    }, 600);
  }

  destroyParts() {
    const loop = (parent) => {
      parent.parts.forEach(async (baseSVG: BaseSVG) => {
        baseSVG.svg = undefined;
        if (baseSVG.parts !== undefined) loop(baseSVG);
      });
    };
    const house = this.house$.value;
    loop(house);
    loop(house.cross);
    loop(house.stair);
  }

  getGroups(sensorType: SensorType) {
    const house = this.house$.value;
    return [
      ...new Set(
        Object.values(house.partsFlatten)
          .filter((x) => x instanceof Sensor)
          .filter((x: Sensor<any>) => x.sensorType === sensorType)
          .map((x: Sensor<any>) => x.group)
      ),
    ]
      .filter((x) => x)
      .sort((a, b) => a - b);
  }

  getOutlets(sensorType: SensorType): number {
    const house = this.house$.value;
    return Object.values(house.partsFlatten)
      .filter((x) => x instanceof Sensor)
      .filter((x: Sensor<any>) => x.sensorType === sensorType)
      .map((x: Sensor<any>) => x.amount)
      .reduce((a, b) => a + b, 0);
  }

  getCable(sensorType: SensorType, decimals = 1) {
    const house = this.house$.value;
    return round(
      Object.values(house.partsFlatten)
        .filter((x) => x instanceof Sensor)
        .filter((x: Sensor<any>) => x.sensorType === sensorType)
        .map((x: Sensor<any>) => x.cableLength)
        .reduce((a, b) => a + b, 0),
      decimals
    );
  }

  getWallLength() {
    const house = this.house$.value;

    const innerLength = Math.ceil(
      sum(
        Object.values(house.partsFlatten)
          .filter((x) => x instanceof Wall)
          .map((x: Wall) => {
            let l = 0;
            if (x.type === WallType.inner) l += x.getLength(WallSide.out);
            l += x.getLength(WallSide.in);
            return l;
          })
      )
    );

    const outerLength = Math.ceil(
      sum(
        Object.values(house.partsFlatten)
          .filter((x) => x instanceof Wall)
          .filter((x: Wall) => x.type === WallType.outer)
          .map((x: Wall) => x.getLength(WallSide.out)),
        1
      )
    );

    return {
      innerLength,
      outerLength,
    };
  }

  getWallArea() {
    const house = this.house$.value;

    const innerArea = Math.ceil(
      sum(
        Object.values(house.partsFlatten)
          .filter((x) => x instanceof Wall)
          .map((x: Wall) => {
            let l = 0;
            if (x.type === WallType.inner) l += x.getArea(WallSide.out);
            l += x.getArea(WallSide.in);
            return l;
          })
      )
    );

    const outerArea = Math.ceil(
      sum(
        Object.values(house.partsFlatten)
          .filter((x) => x instanceof Wall)
          .filter((x: Wall) => x.type === WallType.outer)
          .map((x: Wall) => x.getArea(WallSide.out)),
        1
      )
    );

    return {
      innerArea,
      outerArea,
    };
  }

  getT<T>(
    type,
    keys: (keyof T)[],
    callback: (key: T) => Partial<Cost>,
    filterCallback: (key: T) => boolean = () => true,
    count = true
  ) {
    const uuid = generateUUID();
    const parts = Object.values(
      this.house$.value.partsFlatten
        .filter((x) => x instanceof (type as any))
        .filter((x) => filterCallback(x as any))
        .reduce((accumulator, value: BaseSVG) => {
          const key = keys.map((x) => `${value[x as any]}`).join(",");
          if (!(key in accumulator)) {
            accumulator[key] = {
              count: 0,
              part: value,
            };
          }
          if (type === Sensor && !count) {
            accumulator[key].count += (value as Sensor<any>).getLength();
          } else {
            accumulator[key].count += 1;
          }
          return accumulator;
        }, {})
    ).map((counter: { count: number; part: T }) => {
      const cost = new Cost(callback(counter.part));

      cost.amount = round(counter.count, 1);
      cost.uuid = uuid;
      return cost;
    });

    if (parts.length > 1) {
      const groupRow = new GroupRow({
        uuid,
        name: `${parts[0].name}`,
        costs: parts,
      });
      groupRow[parts[0].name] = false;
      return groupRow;
    } else {
      if (!parts[0]) return undefined;
      const row = parts[0];
      row.uuid = undefined;
      return row;
    }
  }

  fromLonLatToLocal(xy: number[]): number[] {
    const house = this.house$.value;
    const { lat, lng } = house.orientation;
    const [houseX, houseY] = fromLonLat([lng, lat]);

    const xy2 = rotateXY(xy, [houseX, houseY], -house.orientation.rotation);
    return xy2;
  }

  fromLocalToLonLat(xy: xy, orientation, center) {
    const house = this.house$.value;
    const { lat, lng } = orientation;
    var r_earth = 6378.137;
    var pi = Math.PI;

    xy = [xy[0] - center[0], xy[1] - center[1]];
    const new_latitude = lat + ((xy[1] / r_earth) * (180 / pi)) / 1000;
    const new_longitude =
      lng +
      ((xy[0] / r_earth) * (180 / pi)) / Math.cos((lat * pi) / 180) / 1000;
    return [fromLonLat([new_longitude, new_latitude]), xy] as [xy, xy];
  }

  getGaragePolygon() {
    const house = this.house$.value;
    const garage = house.garage;
    const orientation = garage.orientation;
    let points = [
      [0, 0],
      [0, garage.width],
      [garage.length, garage.width],
      [garage.length, 0],
      [0, 0],
    ];
    const localAndGlobal = points
      .map((xy) => rotateXY(xy, [0, 0], 180 - orientation.rotation))
      .map((xy) => this.fromLocalToLonLat(xy, orientation, [0, 0]));
    const coords = localAndGlobal.map((x) => x[0]);
    coords.push(coords[0]);
    const polygon = this.turfService.coordsDissolveToPolygon(coords);
    return {
      polygon,
      localAndGlobal,
    };
  }

  getFootPrintPolygon() {
    const house = this.house$.value;
    const orientation = house.orientation;
    const walls = house.partsFlatten.filter(
      (x) => x instanceof Wall && x.type === WallType.outer
    ) as Wall[];

    let points = walls
      .filter((x) => x.floor === Floor.all)
      .flatMap((x) => x.sides[WallSide.out]);

    const localAndGlobal = points
      .map((xy) => rotateXY(xy, house.centerHouse, 180 - orientation.rotation))
      .map((xy) => this.fromLocalToLonLat(xy, orientation, house.centerHouse));

    const coords = localAndGlobal.map((x) => x[0]);
    coords.push(coords[0]);

    const polygon = this.turfService.coordsDissolveToPolygon(coords);

    const weLine = new LineString([
      centerBetweenPoints(coords[2], coords[3]),
      centerBetweenPoints(coords[14], coords[15]),
    ]);
    const nsLine = new LineString([
      centerBetweenPoints(coords[8], coords[9]),
      centerBetweenPoints(coords[20], coords[21]),
    ]);

    const roofLines = new MultiLineString([weLine, nsLine]);
    return {
      polygon,
      roofLines,
      localAndGlobal,
    };
  }
}
