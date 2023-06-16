import { Injectable } from "@angular/core";
import { fromEvent, Subscription, throttleTime } from "rxjs";
import { AppService } from "../app.service";
import { HouseService } from "../house/house.service";
import * as d3 from "d3";
import { distanceBetweenPoints, round } from "../shared/global-functions";
import { Graphic } from "../components/enum.data";
import { DistanceSVG } from "../house-parts/svg-other/distance.svg";
import { BaseSVG } from "../model/base.model";
import { AppPolyline } from "../model/polyline.model";
import { HousePart, xy } from "../house/house.model";
import { AppPolygon } from "../model/polygon.model";
import { Other } from "../house-parts/other.model";
import { HousePartModel } from "../house-parts/model/housePart.model";
import { Room } from "../house-parts/room.model";
import { Wall, WallSide } from "../house-parts/wall.model";

@Injectable({
  providedIn: "root",
})
export class D3DistanceService {
  subscriptions: Subscription[] = [];
  isDistance = false;
  distanceMouseFirst: "first" | "second" | "fixed" = "first";
  model: Other<DistanceSVG>;

  coords: xy[] = [];
  models: HousePartModel<any>[];
  target: SVGElement;

  constructor(
    public houseService: HouseService,
    public appService: AppService
  ) {}

  init(target, models: HousePartModel<any>[], callback) {
    this.target = target;
    this.model = new Other<DistanceSVG>({
      type: "distance",
      housePart: HousePart.distance,
      selector: "g-distance",
    });
    callback(this.model);
    this.models = models;
  }

  stop() {
    this.subscriptions.forEach((x) => x.unsubscribe());
    this.model.setVisibility(false);
    this.isDistance = false;
    this.subscriptions = [];
    this.appService.update$.next();
  }

  start() {
    console.clear();
    console.log(`start distance`, this.subscriptions.length);

    if (this.subscriptions.length > 0) {
      this.stop();
      return;
    }

    const graphic = this.appService.scroll$.value.graphic;

    console.log(this.model.svg.svg.node());
    console.log(this.target);
    // crosshair
    if (!this.model?.svg) {
      console.error(`svg not found`, `svg.${graphic}`);
      return;
    }
    this.getParts();

    this.model.svg.drawWhenNotVisible();
    this.distanceMouseFirst = "first";
    this.isDistance = true;

    this.model.setVisibility(true);

    this.subscriptions.push(
      ...[
        fromEvent(this.target, "mousemove")
          .pipe(throttleTime(100))
          .subscribe((e: MouseEvent) => {
            this.mousemove(e);
          }),
        fromEvent(this.target, "click").subscribe((e: MouseEvent) => {
          this.click(e);
        }),
        fromEvent(document, "keydown").subscribe((e: MouseEvent) => {
          this.stop();
        }),
      ]
    );
  }

  click(e: MouseEvent) {
    if (this.distanceMouseFirst === "first") {
      this.distanceMouseFirst = "second";
    } else if (this.distanceMouseFirst === "second") {
      this.distanceMouseFirst = "fixed";
    } else if (this.distanceMouseFirst === "fixed") {
      this.distanceMouseFirst = "first";
    }
    this.appService.update$.next();
  }

  mousemove(e: MouseEvent) {
    const [mouseX, mouseY] = d3.pointer(e);
    let mouse: xy = [round(mouseX), round(mouseY)];
    let threshold = 0.2;

    const meterPerPixel = Number(this.target.getAttribute("meterPerPixel"));
    threshold = meterPerPixel * 10;

    const arr = this.coords
      .filter((x) => x)
      .map((coords) => {
        return {
          coords,
          d: distanceBetweenPoints(mouse, coords),
        };
      })
      .filter((x) => x.d <= threshold)
      .sort((a, b) => a.d - b.d)
      .map((x) => x.coords);

    if (arr.length > 0) mouse = arr[0];

    if (["first"].includes(this.distanceMouseFirst)) {
      this.model.svg.point1 = mouse;
      this.model.svg.point2 = undefined;
    }
    if (["second"].includes(this.distanceMouseFirst)) {
      this.model.svg.point2 = mouse;
    }
    this.appService.update$.next();
  }

  private getParts() {
    this.coords = [];
    this.models.forEach((model: HousePartModel) => {
      let coords: xy[] = [];
      if (model instanceof Wall) {
        coords = model.coords;
      }
      this.coords.push(...coords);
    });
  }
}
