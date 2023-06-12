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
import { StatesService } from "src/app/services/states.service";
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
  showFooter = true;

  sectionScroll: { [key in Section]?: any } = {};
  goalLine = 0.4;
  popupActive$ = this.appService.popupActive$;
  fullscreen$ = this.appService.fullscreen$;
  scroll$ = this.appService.scroll$;
  floor$ = this.appService.floor$;
  tag$ = this.appService.tag$;
  states$ = this.statesService.states$;
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

    private statesService: StatesService
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
        elTop: el.offsetTop,
        elBottom: el.offsetTop + el.offsetHeight,
      };
    });
    this.calcSection();

    const params = this.activatedRoute.snapshot.params;
    const tag = params["tag"];
    if (tag) this.tag$.next(tag);
    this.loaded = true;
  }

  checkFooter() {
    let flag = true;
    if ([Graphic.House3D].includes(this.graphic)) flag = false;
    this.showFooter = flag;
  }

  calcSection() {
    this.section = this.getSection();

    if (this.section === undefined || this.section === "") {
      this.graphic = Graphic.none;
      this.graphicSide = GraphicSide.none;
    } else {
      const graphic = this.appService.setGraphic(this.section);
      if (this.graphic !== graphic) {
        // console.log("Swap side!");
        this.tooltipService.detachOverlay();
      }
      this.graphic = graphic;
      this.graphicSide = this.appService.getSide(this.graphic);
      document
        .querySelector(`section#${this.section}`)
        .classList.add("section-active");
    }

    this.checkFooter();
    this.appService.scroll$.next({
      scroll: round(window.pageYOffset, 0),
      percentage: this.getVerticalScrollPercentage(document.body),
      section: this.section,
      graphicSide: this.graphicSide,
      graphic: this.graphic,
    });

    // should be after scroll$.next
    this.statesService.updateStateBasedOnSection(this.section, this.loaded);

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

  getSection(): Section {
    var goalLine = round(window.innerHeight * this.goalLine, 0);
    var windowTop = round(window.pageYOffset, 0);
    var goal = windowTop + goalLine;
    this.sectionEls.forEach((el) => {
      const id = el.id;
      this.sectionScroll[id].start = this.sectionScroll[id].elTop <= goal;
      this.sectionScroll[id].end = this.sectionScroll[id].elBottom <= goal;
      this.sectionScroll[id].overlap =
        this.sectionScroll[id].start && !this.sectionScroll[id].end;
      el.classList.remove("section-active");
    });
    const next = Object.values(this.sectionScroll)
      .filter((x) => x.overlap)
      .sort((a, b) => b.elTop - a.elTop);
    return next && next[0] ? next[0].id : undefined;
  }
}
