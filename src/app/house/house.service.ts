import { Injectable } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { LineString, MultiLineString } from "ol/geom";
import { fromLonLat } from "ol/proj";
import { BehaviorSubject } from "rxjs";
import { generateUUID } from "three/src/math/MathUtils";
import { AppService } from "../app.service";
import { Floor, SensorType, Tag } from "../components/enum.data";
import { Wall, WallSide, WallType } from "../house-parts/wall.model";
import { BaseSVG } from "../model/base.model";
import { TurfService } from "../pages/page-map/openlayers/turf.service";
import {
  centerBetweenPoints,
  rotateXY,
  round,
  sum,
} from "../shared/global-functions";
import { Cost, GroupRow } from "./cost.model";
import { House, HouseUser, xy } from "./house.model";
import { lindeLund } from "./lindelund/lindeLund";
import { Sensor } from "../house-parts/sensor-models/sensor.model";
import { HousePartModel } from "../house-parts/model/housePart.model";
import { Water } from "../house-parts/sensor-models/water.model";

@Injectable({
  providedIn: "root",
})
export class HouseService {
  cookieKey = "house";
  house$ = new BehaviorSubject(this.getStore(lindeLund));
  timeout;

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
        house.houseParts.sensors
          .filter((x: Sensor<any>) => x.sensorType === sensorType)
          .map((x: Sensor<any>) => x.group)
      ),
    ]
      .filter((x) => x)
      .sort((a, b) => a - b);
  }

  getOutlets(sensorType: SensorType): number {
    const house = this.house$.value;
    return house.houseParts.sensors
      .filter((x: Sensor<any>) => x.sensorType === sensorType)
      .map((x: Sensor<any>) => x.amount)
      .reduce((a, b) => a + b, 0);
  }

  getCable(sensorType: SensorType, decimals = 1) {
    const house = this.house$.value;
    return round(
      house.houseParts.sensors
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
        house.houseParts.walls.map((x: Wall) => {
          let l = 0;
          if (x.type === WallType.inner) l += x.getLength(WallSide.out);
          l += x.getLength(WallSide.in);
          return l;
        })
      )
    );

    const outerLength = Math.ceil(
      sum(
        house.houseParts.walls
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
        house.houseParts.walls
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
        house.houseParts.walls
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
    const walls = house.houseParts.walls.filter(
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
