import { Injectable } from "@angular/core";
import { fromEvent, Subscription } from "rxjs";
import { AppService } from "../app.service";
import { HouseService } from "../house/house.service";
import * as d3 from "d3";
import { distanceBetweenPoints, round } from "../shared/global-functions";
import { Graphic } from "../components/enum.data";
import { AppDistance } from "../model/distance.model";
import { BaseSVG } from "../model/base.model";
import { AppPolyline } from "../model/polyline.model";
import { xy } from "../house/house.model";
import { AppPolygon } from "../model/polygon.model";

@Injectable({
  providedIn: "root",
})
export class D3DistanceService {
  distanceSubscriptions: Subscription[] = [];
  isDistance = false;
  distanceMouseFirst: "first" | "second" | "fixed" = "first";
  distanceSVG: AppDistance;

  coords: xy[] = [];

  constructor(
    public houseService: HouseService,
    public appService: AppService
  ) {}

  stop() {
    this.distanceSubscriptions.forEach((x) => x.unsubscribe());
    this.distanceSVG.visible = false;
    this.isDistance = false;
    this.distanceSubscriptions = [];
    this.appService.update$.next();
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
    console.log(this.distanceSVG.visible);

    let mouse: xy = [round(mouseX), round(mouseY)];
    let threshold = 0.2;

    try {
      const x = e
        .composedPath()
        .find((x: HTMLElement) => x.tagName === "svg") as SVGElement;
      const meterPerPixel = Number(x.getAttribute("meterPerPixel"));
      threshold = meterPerPixel * 10;
    } catch (e) {
      console.log(e);
    }

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
      this.distanceSVG.point1 = mouse;
      this.distanceSVG.point2 = undefined;
    }
    if (["second"].includes(this.distanceMouseFirst)) {
      this.distanceSVG.point2 = mouse;
    }
    this.appService.update$.next();
  }

  getParts(parts: BaseSVG[]) {
    this.distanceSVG = parts.find(
      (x) => x instanceof AppDistance
    ) as AppDistance;

    this.coords = [];
    parts.forEach((part) => {
      if (part instanceof AppPolyline) {
        this.coords.push(...part.coords);
      }
      if (part instanceof AppPolygon) {
        this.coords.push(...part.coords);
      }
    });
  }

  start() {
    if (this.distanceSubscriptions.length > 0) {
      this.stop();
      return;
    }

    const graphic = this.appService.scroll$.value.graphic;
    const svg = document.querySelector(`svg.${graphic}`);
    // crosshair
    console.log(svg, `svg.${graphic}`);
    if (!svg) {
      console.error(`svg not found`, `svg.${graphic}`);

      return;
    }

    const g = svg.querySelector("g");

    if (graphic === Graphic.cross) {
      const cross = this.houseService.house$.value.cross;
      this.getParts(cross.parts);
    }
    if (graphic === Graphic.house2D) {
      const house = this.houseService.house$.value;
      this.getParts(house.parts);
    }
    if (graphic === Graphic.stairCross) {
      const stair = this.houseService.house$.value.stair.cross;
      this.getParts(stair.parts);
    }
    if (graphic === Graphic.stairPlan) {
      const stair = this.houseService.house$.value.stair;
      this.getParts(stair.parts);
    }

    this.distanceSVG.clear();
    this.distanceMouseFirst = "first";
    this.isDistance = true;

    this.distanceSVG.visible = true;
    console.log(this.distanceSVG.visible);

    this.distanceSubscriptions.push(
      ...[
        fromEvent(g, "mousemove").subscribe((e: MouseEvent) => {
          this.mousemove(e);
        }),
        fromEvent(g, "click").subscribe((e: MouseEvent) => {
          this.click(e);
        }),
        fromEvent(document, "keydown").subscribe((e: MouseEvent) => {
          this.stop();
        }),
      ]
    );

    console.log(this.distanceSVG);
  }
}
