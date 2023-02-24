import { Component, ElementRef, OnInit } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";

import { faTemperatureHigh, faMound } from "@fortawesome/free-solid-svg-icons";

import { CookieService } from "ngx-cookie-service";
import { filter } from "rxjs";
import { ThreeService } from "src/app/3d-three/three.service";
import { AppService } from "src/app/app.service";
import { HouseService } from "src/app/house/house.service";
import { animationSlideInOut } from "../animations";
import {
  ConstructionParts,
  Floor,
  Graphic,
  House3DParts,
  SensorType,
  State,
  StatesExtended,
} from "../enum.data";

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
  house$ = this.houseService.house$;
  Floor = Floor;
  floor$ = this.appService.floor$;
  scroll$ = this.appService.scroll$;
  states$ = this.appService.states$;
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

  faTemperatureHigh = faTemperatureHigh;
  faMound = faMound;

  extra = true;

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
    private elementRef: ElementRef,
    private houseService: HouseService,
    private cookieService: CookieService,
    private router: Router,
    private threeService: ThreeService
  ) {}

  ngOnInit(): void {}

  checkState(state: StatesExtended): boolean {
    return this.states$.value[state] === true;
  }
  swapCamera() {
    this.threeService.swapCamera();
  }
}
