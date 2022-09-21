import { Component, ElementRef, OnInit } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { CookieService } from "ngx-cookie-service";
import { filter } from "rxjs";
import { AppService } from "src/app/app.service";
import { HouseService } from "src/app/house/house.service";
import { animationSlideInOut } from "../animations";
import {
  Floor,
  Graphic,
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

  extra = true;

  get fullscreen() {
    return this.appService.fullscreen$.value;
  }
  set fullscreen(state) {
    this.cookieService.set("fullscreen", `${state}`);
    this.appService.fullscreen$.next(state);
  }
  constructor(
    public appService: AppService,
    private elementRef: ElementRef,
    private houseService: HouseService,
    private cookieService: CookieService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  checkState(state: StatesExtended): boolean {
    return this.states$.value[state] === true;
  }
}
