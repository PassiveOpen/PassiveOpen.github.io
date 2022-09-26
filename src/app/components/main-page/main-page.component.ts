import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Renderer2,
} from "@angular/core";
import { ActivatedRoute, NavigationEnd, Params, Router } from "@angular/router";
import {
  tap,
  filter,
  map,
  startWith,
  fromEvent,
  throttle,
  throttleTime,
} from "rxjs";
import { AppService } from "src/app/app.service";
import { RoofStyle } from "src/app/house/cross.model";
import { HouseService } from "src/app/house/house.service";
import { StateService } from "src/app/house/visible.service";
import { round } from "src/app/shared/global-functions";
import { animationFallInOut, animationSlideInOut } from "../animations";
import { Graphic, GraphicSide, State, Section, Tag } from "../enum.data";
import { TooltipService } from "../tooltip/tooltip.service";

@Component({
  selector: "app-main-page",
  styleUrls: ["./main-page.component.scss"],
  templateUrl: "./main-page.component.html",
  animations: [animationSlideInOut, animationFallInOut],
})
export class AppMainPageComponent implements AfterViewInit {
  sectionEls: NodeListOf<HTMLElement>;

  sections = Object.keys(Section);
  section;
  Tag = Tag;
  graphicSide;
  GraphicSide = GraphicSide;
  Graphic = Graphic;
  graphic;

  sectionScroll: { [key in Section]?: any } = {};
  goalLine = 0.4;
  popupActive$ = this.appService.popupActive$;
  fullscreen$ = this.appService.fullscreen$;
  scroll$ = this.appService.scroll$;
  floor$ = this.appService.floor$;
  tag$ = this.appService.tag$;
  states$ = this.appService.states$;
  page$ = this.appService.page$;

  cssStates$ = this.states$.pipe(
    map((stateObj) =>
      Object.entries(stateObj)
        .filter(([state, bool]) => bool === true)
        .map(([state, bool]) => `state-${state}`)
        .join(" ")
    )
  );

  loaded = false;

  constructor(
    private appService: AppService,
    private tooltipService: TooltipService,
    private houseService: HouseService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private stateService: StateService // creates a instance of this service
  ) {
    fromEvent(window, "scroll")
      // .pipe(throttleTime(600))
      .subscribe((event) => {
        this.calcSection();
      });
  }

  ngAfterViewInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((e) => {
        setTimeout(() => {
          this.setup();
        }, 0);
      });
    this.setup();
  }

  setup() {
    // console.log("setup");

    this.sectionEls = document.querySelectorAll<HTMLElement>("section");
    this.sectionScroll = {};
    this.sectionEls.forEach((el) => {
      const id = el.id;
      this.sectionScroll[id] = {
        id,
        top: el.offsetTop,
      };
    });
    this.calcSection();

    const params = this.activatedRoute.snapshot.params;
    const tag = params["tag"];
    if (tag) this.tag$.next(tag);
    this.loaded = true;
  }

  calcSection() {
    this.section = this.getSection();
    if (this.section === undefined) {
      this.graphic = Graphic.none;
      this.graphicSide = GraphicSide.none;
    } else {
      this.graphic = this.setGraphic(this.section);
      this.graphicSide = this.getSide();

      document
        .querySelector(`section#${this.section}`)
        .classList.add("section-active");
    }

    this.appService.scroll$.next({
      scroll: round(window.pageYOffset, 0),
      percentage: this.getVerticalScrollPercentage(document.body),
      section: this.section,
      graphicSide: this.graphicSide,
      graphic: this.graphic,
    });

    // should be after scroll$.next
    this.stateService.updateStateBasedOnSection(this.section, this.loaded);

    const queryParams: Params = {
      section: this.section,
      // states: Object.keys(this.states$.value)
      //   .filter((k, v) => v)
      //   .map((k, v) => k)
      //   .join(","),
    };
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: queryParams,
      replaceUrl: true,
      queryParamsHandling: "merge", // remove to replace all query params by provided
    });
  }

  getVerticalScrollPercentage(elm) {
    var p = elm.parentNode;
    return round(
      (elm.scrollTop || p.scrollTop) / (p.scrollHeight - p.clientHeight)
    );
  }

  setGraphic(section: Section): Graphic {
    let graphic = Graphic.none;
    if (
      [
        Section.welcome,
        Section.passiv,
        Section.basics,
        Section.extensions,
        Section.tower,
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
      graphic = Graphic.plan;
    }
    if (
      [
        Section.roof70,
        Section.roofBasics,
        Section.roofChoice,
        Section.roofCircle,
        Section.roofEdge,
        Section.roofIntermezzo,
      ].includes(section)
    ) {
      graphic = Graphic.cross;
      if ([Section.roof70].includes(section)) {
        this.houseService.update("cross", "viewedRoofStyle", RoofStyle.roof70);
      }
      if ([Section.roofBasics, Section.roofCircle].includes(section)) {
        this.houseService.update(
          "cross",
          "viewedRoofStyle",
          RoofStyle.roofCircle
        );
      }
    }
    if (
      [
        Section.stairStart,
        Section.stairBasic,
        Section.stairCheck,
        Section.stairPlan,
      ].includes(section)
    ) {
      graphic = Graphic.stairCross;
    }
    if ([Section.stairPlan].includes(section)) {
      graphic = Graphic.stairPlan;
    }
    if (
      [
        Section.constructionParameters,
        Section.facadeStart,
        Section.facadeWindow,
        Section.facadeDoor,
      ].includes(section)
    ) {
      graphic = Graphic.none;
    }
    if (
      [
        Section.constructionWelcome,
        Section.constructionCrawlerSpace,
        Section.constructionFloor,
        Section.constructionFoundation,
        Section.constructionRoof,
        Section.constructionWall,
        Section.constructionWallFinish,
      ].includes(section)
    ) {
      graphic = Graphic.window;
    }
    if (
      [
        Section.installationDrinkWater,
        Section.installationElectricity,
        Section.installationGreyWater,
        Section.installationHeating,
        Section.installationSmartHome,
        Section.installationVentilation,
      ].includes(section)
    ) {
      graphic = Graphic.none;
    }

    if (this.graphic !== graphic) {
      console.log("Swap side!");
      this.tooltipService.detachOverlay();
    }
    this.graphic = graphic;
    return graphic;
  }

  getSection(): Section {
    var windowHalf = round(window.innerHeight * this.goalLine, 0);
    var windowTop = round(window.pageYOffset, 0);
    var goalLine = windowTop + windowHalf;
    this.sectionEls.forEach((el) => {
      const id = el.id;
      this.sectionScroll[id].past = this.sectionScroll[id].top < goalLine;
      el.classList.remove("section-active");
    });
    const next = Object.values(this.sectionScroll)
      .filter((x) => x.past)
      .sort((a, b) => b.top - a.top);
    return next && next[0] ? next[0].id : undefined;
  }

  getSide(): GraphicSide {
    let graphicSide = GraphicSide.right;

    if ([Graphic.cross].includes(this.graphic)) {
      graphicSide = GraphicSide.left;
    }
    if ([Graphic.none].includes(this.graphic)) {
      graphicSide = GraphicSide.none;
    }

    return graphicSide;
  }
}
