import { Component, ElementRef, Input, OnInit } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";

import { faTemperatureHigh, faMound } from "@fortawesome/free-solid-svg-icons";

import { CookieService } from "ngx-cookie-service";
import { filter } from "rxjs";
import { ThreeService } from "src/app/3d-three/three.service";
import { AppService } from "src/app/app.service";
import { HouseService } from "src/app/house/house.service";
import { MapService } from "src/app/pages/page-map/map.service";
import { OLBaseMapService } from "src/app/pages/page-map/openlayers/ol-basemap.service";
import { OLMeasureService } from "src/app/pages/page-map/openlayers/ol-measure.service";
import { environment } from "src/environments/environment";
import { animationSlideInOut } from "../animations";
import {
  ConstructionParts,
  Floor,
  Graphic,
  Helpers3D,
  House3DParts,
  SensorType,
  State,
  StatesExtended,
} from "../enum.data";
import { BasemapKey } from "src/app/pages/page-map/openlayers/ol-model";
import { MatSlider } from "@angular/material/slider";
import WebGLTileLayer from "ol/layer/WebGLTile";
import { StatesService } from "src/app/services/states.service";

type SensorIcon = {
  state: SensorType;
  title: string;
};

@Component({
  selector: "controls",
  templateUrl: "./controls.component.html",
  styleUrls: ["./controls.component.scss"],
  animations: [animationSlideInOut],
})
export class ControlsComponent implements OnInit {
  @Input() floatLeft: boolean = false;
  get toc() {
    return this.cookieService.get("toc") === "true";
  }
  set toc(state: boolean) {
    this.cookieService.set("toc", `${state}`);
  }

  BasemapKeys = Object.values(BasemapKey);

  house$ = this.houseService.house$;
  Floor = Floor;
  floor$ = this.appService.floor$;
  scroll$ = this.appService.scroll$;
  states$ = this.statesService.states$;
  setFloor = () => this.appService.setFloor();

  Graphic = Graphic;
  States = State;
  page$ = this.appService.page$;
  sensors: SensorIcon[] = Object.values(SensorType).map((x) => {
    return { state: x, title: x };
  });

  constructionParts = Object.values(ConstructionParts);
  ConstructionParts = ConstructionParts;

  house3DParts = Object.values(House3DParts);
  House3DParts = House3DParts;

  Helpers3D = Helpers3D;
  helpers3D = Object.values(Helpers3D);

  faTemperatureHigh = faTemperatureHigh;
  faMound = faMound;

  get fullscreen() {
    return this.appService.fullscreen$.value;
  }
  set fullscreen(state) {
    this.cookieService.set("fullscreen", `${state}`);
    this.appService.fullscreen$.next(state);
  }

  get camera() {
    return this.threeService.cameraPerspective;
  }

  constructor(
    public appService: AppService,
    public elementRef: ElementRef,
    public houseService: HouseService,
    public cookieService: CookieService,
    public olMeasureService: OLMeasureService,
    public olBaseMapService: OLBaseMapService,
    public threeService: ThreeService,
    public statesService: StatesService,
    public mapService: MapService
  ) {}

  ngOnInit(): void {}

  getState(state: StatesExtended): boolean {
    return this.states$.value[state] === true;
  }

  swapCamera() {
    this.threeService.swapCamera();
  }

  debug = false;

  set(x: MatSlider, y) {
    if (this.debug) {
      const min = x.value / 255;
      const max = y.value / 255;
      //@ts-ignore
      const demLayer = window.demLayer as WebGLTileLayer;
      demLayer.updateStyleVariables({ min, max, span: max - min });
    } else {
      const contrast = x.value;
      const opacity = y.value;
      //@ts-ignore
      const shadowLayer = window.shadowLayer as WebGLTileLayer;
      shadowLayer.setStyle({
        contrast,
        brightness: opacity,
      });
      console.log(contrast, opacity);

      // shadowLayer.setOpacity(opacity);
    }
  }
  get(i) {
    if (this.debug) {
      //@ts-ignore
      return i == 1 ? window.demMin * 255 : window.demMax * 255;
    } else {
      //@ts-ignore
      return i == 1 ? window.shadowContrast : window.shadowOpacity;
    }
  }
}
