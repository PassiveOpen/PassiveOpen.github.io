import { Injectable } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { CookieService } from "ngx-cookie-service";
import { BehaviorSubject, filter, map, startWith, Subject, tap } from "rxjs";
import {
  Floor,
  Graphic,
  GraphicSide,
  State,
  Section,
  Tag,
  StatesExtended,
} from "./components/enum.data";
import { StatesService } from "./services/states.service";
import { RoofStyle } from "./house/cross.model";

interface Scroll {
  scroll;
  percentage;
  section: Section;
  graphicSide: GraphicSide;
  graphic: Graphic;
}

export type StateObj = { [key in StatesExtended]?: boolean };

@Injectable({
  providedIn: "root",
})
export class AppService {
  darkMode = false;
  title = "Lindelund";
  discord = "https://discord.gg/hrjfzY3yTp";
  github = "https://github.com/PassiveOpen/PassiveOpen.github.io";
  youtube = "https://www.youtube.com/channel/UCtP_RM2k4-27u40nC0ncpdw";
  patreon = "https://www.patreon.com/PassiveOpen";
  instagram = "https://www.instagram.com/2_plings/";

  update$ = new Subject<void>();
  tag$ = new BehaviorSubject(undefined);
  graphic$ = new BehaviorSubject(undefined);
  popupActive$ = new BehaviorSubject(false);
  fullscreen$ = new BehaviorSubject(true);
  page$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(this.router),
    map((event: Router | NavigationEnd) => {
      const routes = event.url.toLowerCase().split("/");
      return routes[1];
    })
  );

  floor$ = new BehaviorSubject(Floor.ground);

  scroll$ = new BehaviorSubject<Scroll>({
    scroll: 0,
    percentage: 0,
    section: undefined,
    graphicSide: undefined,
    graphic: undefined,
  });

  constructor(private cookieService: CookieService, private router: Router) {
    this.getCookies();
  }

  getCookies() {
    console.log("getCookies");

    // ======= floor =======
    let floor = this.cookieService.get("floor");
    if (floor === "") {
      floor = Floor.ground;
    }
    this.floor$.next(floor as Floor);

    // ======= fullscreen =======
    let fullscreen: boolean | string = this.cookieService.get("fullscreen");
    if (fullscreen === "") {
      fullscreen = false;
    } else {
      fullscreen = fullscreen === "true" ? true : false;
    }
    this.fullscreen$.next(fullscreen as boolean);

    // ======= darkmode =======
    let darkMode: boolean | string = this.cookieService.get("darkMode");
    if (darkMode === "") {
      this.setDarkMode(
        window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    } else {
      this.setDarkMode(darkMode === "true");
    }
  }

  getSide(graphic: Graphic): GraphicSide {
    if ([Graphic.cross].includes(graphic)) {
      return GraphicSide.left;
    }
    if ([Graphic.none].includes(graphic)) {
      return GraphicSide.none;
    }
    return GraphicSide.right;
  }

  setGraphic(section: Section) {
    if (
      [
        Section.mainWelcome,
        Section.mainPassiv,
        Section.mainBasics,
        Section.mainExtensions,
        Section.mainTower,
        Section.wiredWelcome,
        Section.wiredPower,
        Section.wiredEthernet,
        Section.wiredExtra,
        Section.wiredLight,
        Section.wiredSafety,
        Section.wiredVent,
        Section.wiredWater,
      ].includes(section)
    ) {
      return Graphic.house2D;
    } else if (
      [
        Section.roof70,
        Section.roofBasics,
        Section.roofChoice,
        Section.roofCircle,
        Section.roofEdge,
        Section.roofIntermezzo,
        Section.EndOfPageHouse,
      ].includes(section)
    ) {
      return Graphic.cross;
    } else if ([Section.roof70].includes(section)) {
      // this.houseService.update("cross", "viewedRoofStyle", RoofStyle.roof70);
    } else if ([Section.roofBasics, Section.roofCircle].includes(section)) {
      // this.houseService.update(
      //   "cross",
      //   "viewedRoofStyle",
      //   RoofStyle.roofCircle
      // );
    } else if (
      [Section.stairStart, Section.stairBasic, Section.stairCheck].includes(
        section
      )
    ) {
      return Graphic.stairCross;
    } else if ([Section.stairPlan].includes(section)) {
      return Graphic.stairPlan;
    } else if (
      [
        Section.constructionParameters,
        Section.facadeStart,
        Section.facadeWindow,
        Section.facadeDoor,
      ].includes(section)
    ) {
      return Graphic.none;
    } else if (
      [
        Section.constructionWelcome,
        Section.constructionFoundation,
        Section.constructionCrawlerSpace,
        Section.constructionFloor,
        Section.constructionRoof,
        Section.constructionWallFinish,
        Section.constructionWallSole,
        Section.constructionWallJoists,
        Section.constructionWallOSB,
        Section.constructionWallTape,
        Section.constructionWallOuterSheet,
        Section.constructionWallSpace,
        Section.constructionWallFacade,
        Section.constructionWallInsulation,
        Section.constructionWallService,
        Section.constructionWallGips,
        Section.constructionFloor,

        Section.constructionFloorLVL,
        Section.constructionGroundFloor,

        Section.constructionRoofRidge,
        Section.constructionRoofJoist,
        Section.constructionRoofInside,
        Section.constructionRoofOuterSheet,
        Section.constructionRoofSpace,
        Section.constructionRoofTiles,
      ].includes(section)
    ) {
      return Graphic.construction;
    } else if ([Section.House3D].includes(section)) {
      return Graphic.House3D;
    } else if (
      [
        Section.installationDrinkWater,
        Section.installationElectricity,
        Section.installationGreyWater,
        Section.installationHeating,
        Section.installationSmartHome,
        Section.installationVentilation,
      ].includes(section)
    ) {
      return Graphic.none;
    } else if (section.startsWith("energy")) {
      return Graphic.scrollerHeat;
    }
    return Graphic.none;
  }

  setFloor(floor: Floor = undefined) {
    let next;
    if (floor !== undefined) {
      next = floor;
    } else {
      if (this.floor$.value === Floor.ground) {
        next = Floor.top;
      }
      if (this.floor$.value === Floor.top) {
        next = Floor.ground;
      }
    }
    this.floor$.next(next);
    this.cookieService.set("floor", next);
    this.update$.next();
  }

  setTag(tag: Tag) {
    this.tag$.next(tag);
    this.update$.next();
  }

  setDarkMode(state: boolean = undefined, save = false) {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");
    if (state !== undefined) {
      this.darkMode = state;
    } else {
      this.darkMode = !this.darkMode;
    }
    if (this.darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.add("light");
    }
    if (save) this.cookieService.set("darkMode", `${this.darkMode}`, 0.1);
  }
}
