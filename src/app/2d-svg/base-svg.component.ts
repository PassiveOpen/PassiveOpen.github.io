import {
  Component,
  ElementRef,
  HostListener,
  HostBinding,
  Input,
  ViewChild,
} from "@angular/core";
import {
  BehaviorSubject,
  catchError,
  concatAll,
  distinct,
  filter,
  first,
  from,
  map,
  merge,
  mergeMap,
  of,
  Subscription,
  tap,
  throttleTime,
} from "rxjs";
import { AppService } from "src/app/app.service";
import { HouseService } from "src/app/house/house.service";
import { round } from "src/app/shared/global-functions";
import { Graphic, Section, Tag } from "../components/enum.data";
import { TooltipService } from "../components/tooltip/tooltip.service";
import { House, SvgUpdate } from "../house/house.model";
import * as d3 from "d3";
import { Cross } from "../house/cross.model";
import { Stair } from "../house/stairs.model";
import { D3DistanceService } from "./d3Distance.service";
import { ZoomTransform } from "d3";
import { ContextMenuService } from "../components/context-menu/context-menu.service";
import { D3Service } from "./d3.service";

@Component({
  selector: "app-svg-base",
  template: "",
})
export class BasicSVG {
  stringCache = "";

  @HostListener("click", ["$event"]) onClick(e: PointerEvent) {
    this.contextMenuService.closeMenu();
    if (this.d3DistanceService.isDistance) {
      return;
    }

    const getID = (el): string => {
      if (!el || el === this.svgEl.nativeElement) {
        return;
      }
      if ("id" in el && `${el.id}`.length > 0) {
        return el.id;
      } else {
        return getID(el.parentNode);
      }
    };

    const id = getID(e.target);

    const exit = () => {
      this.tooltipService.detachOverlay();
      document.body.classList.remove("selection-active");
      document.querySelectorAll("svg .selected").forEach((d, i) => {
        d.classList.remove("selected");
      });
      return;
    };

    if (!id) {
      return exit();
    }
    const obj = this.house.partsFlatten.find((x) => x.selector === id);

    if (!obj) {
      console.log(
        `Couldnt find [${id}] in `,
        e.target,
        "probably its only a part of its full ID"
      );
      return exit();
    }
    document.body.classList.add("selection-active");
    obj.select();

    this.tooltipService.attachPopup([e.pageX, e.pageY], obj);
    console.log(obj);
  }
  @HostListener("contextmenu", ["$event"])
  preventContextMenu(e: PointerEvent) {
    this.contextMenuService.click(e);
    return false;
  }
  @HostBinding("class.imaged") showingImage: boolean = false;
  @HostBinding("class.print-preview") printPreview: boolean = false;

  @Input() isChild = false;
  graphic: Graphic;
  marginInMeters = [0, 0, 0, 0];
  marginInPixels = [0, 0, 0, 0];
  house$ = this.houseService.house$;
  house: House;
  cross: Cross;
  stair: Stair;

  sections = Object.values(Section);
  section: Section;
  tags = Object.values(Tag);
  tag: Tag;
  meterPerPixel: number;

  @ViewChild("svg") svgEl: ElementRef<SVGElement>;
  svg: d3.Selection<SVGElement, unknown, null, undefined>;
  g: d3.Selection<SVGGElement, unknown, null, undefined>;

  resize$ = new BehaviorSubject(undefined);
  subscriptions: Subscription[] = [];
  observer: ResizeObserver;

  svgHouseSize = [
    [0, 0],
    [200, 100],
  ];

  loaded = false;

  constructor(
    public houseService: HouseService,
    public appService: AppService,
    public tooltipService: TooltipService,
    public host: ElementRef,
    public d3Service: D3Service,
    public d3DistanceService: D3DistanceService,
    public contextMenuService: ContextMenuService
  ) {}

  //// LifeCicle ////

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    if (this.observer) this.observer.unobserve(this.host.nativeElement);
  }
  svgUpdateMarginAndSize() {}

  setUp() {
    this.houseService.destroyParts();

    this.svg = d3.select<SVGElement, undefined>(this.svgEl.nativeElement);
    this.g = this.svg.select("g");
    // resize
    this.observer = new ResizeObserver((x) => this.resize$.next(x));
    this.observer.observe(this.host.nativeElement);

    this.resize$.pipe(
      catchError((e) => {
        return of(undefined);
      })
    );

    this.subscriptions.push(
      ...[
        merge(
          this.appService.fullscreen$.pipe(
            tap((fullscreen) => {
              if (fullscreen) {
                this.svg.call(
                  d3.zoom().on("zoom", (e) => {
                    this.setTransform(e.transform, 0);
                  })
                );
              } else {
                this.svg.on(".zoom", null);
                this.setTransform();
              }
            })
          ),
          this.appService.scroll$.pipe(
            tap((x) => {
              const scroll = this.appService.scroll$.value;
              this.section = scroll.section;
            })
          )
        ).subscribe((x) => {
          // console.log("scroll");
        }),
        merge(this.appService.update$, this.house$)
          .pipe(
            tap((x) => {
              const house = this.house$.value;
              this.house = house;
              this.cross = house.cross;
              this.stair = house.stair;
            })
          )
          .subscribe((x) => {
            this.updateSVG(true);
          }),
        merge(
          this.appService.states$,
          this.appService.svgTransform$.pipe(
            tap((svgTransform) => {
              if (this.loaded) return;
              if (this.graphic in svgTransform) {
                const zoom: { k: number; x: number; y: number } =
                  svgTransform[this.graphic];
                this.setTransform(new ZoomTransform(zoom.k, zoom.x, zoom.y));
              }
            })
          ),
          this.resize$.pipe(
            filter((x) => !this.showingImage),
            throttleTime(10)
            // tap((x) => console.log("scrollresize"))
          )
        )
          .pipe(
            filter((x) => this.house !== undefined),
            first()
          )
          .subscribe((x) => {
            this.updateSVG();
          }),
      ]
    );

    this.loaded = true;
  }

  setTransform(transform: any = "translate(0,0) scale(1)", duration = 10000) {
    if (this.printPreview) return;
    if (this.loaded) {
      this.appService.setTransformCookie(transform, this.graphic);
    }
    this.g.transition().duration(duration).attr("transform", transform);
  }

  updateSVG(forceUpdate = false) {
    this.tooltipService.updateOverlay();
    this.svgUpdateMarginAndSize();
    this.svgSpecificUpdate();
    const [[x, y], [maxX, maxY]] = this.svgHouseSize;
    const minX = -this.marginInMeters[3] + x;
    const minY = -this.marginInMeters[0] + y;
    const widthMeter = maxX + this.marginInMeters[3] + this.marginInMeters[1];
    const heightMeter = maxY + this.marginInMeters[0] + this.marginInMeters[2];

    const hasZoom = this.g.attr("transform") === "translate(0,0) scale(1)";
    const windowWidth =
      this.showingImage || hasZoom
        ? window.outerWidth / 2
        : this.svgEl.nativeElement.clientWidth;
    const windowHeight =
      this.showingImage || hasZoom
        ? window.outerHeight / 2
        : this.svgEl.nativeElement.clientHeight;

    const svgW = Math.abs(
      round(windowWidth, 0) - this.marginInPixels[1] - this.marginInPixels[3]
    );
    const svgH = Math.abs(
      round(windowHeight, 0) - this.marginInPixels[0] - this.marginInPixels[2]
    );
    const scaleW = round(widthMeter / svgW);
    const scaleH = round(heightMeter / svgH);
    const meterPerPixel = Math.max(scaleW, scaleH) / this.getScale();
    const zoomMotion = this.meterPerPixel !== meterPerPixel;
    this.meterPerPixel = meterPerPixel;
    this.svgEl.nativeElement.setAttribute("meterPerPixel", `${meterPerPixel}`);

    const margin = this.marginInPixels.map((x) =>
      round(x * this.meterPerPixel)
    );

    if (!this.isChild) {
      if (this.printPreview) {
        const paper = [21.0, 29.7];
        this.svg.attr("viewBox", `-2 -2 ${paper[1]} ${paper[0]}`);
      } else {
        this.svg
          .transition()
          .duration(1000)
          .attr(
            "viewBox",
            `
          ${-margin[3] + minX} 
          ${-margin[0] + minY} 
          ${Math.abs(widthMeter + (margin[3] + margin[1]))} 
          ${Math.abs(heightMeter + (margin[0] + margin[2]))}`
          );
      }
    }

    const stringCache = [
      this.appService.floor$.value,
      this.appService.scroll$.value.section,
      Object.entries(this.appService.states$.value)
        .filter(([k, v]) => v === true)
        .map(([k, v]) => k),
      this.graphic,
    ].join("-");
    const redrawAll =
      this.stringCache !== stringCache || this.stringCache === "";
    this.stringCache = stringCache;
    if (forceUpdate === false && !(redrawAll || zoomMotion)) return;
    // console.log(stringCache, zoomed, forceUpdate);

    this.house.redrawHouse({
      floor: this.appService.floor$.value,
      graphic: this.graphic,
      redrawAll: redrawAll || forceUpdate,
      meterPerPixel: this.meterPerPixel,
      theme: undefined,
      print: this.printPreview,
    });
  }
  svgSpecificUpdate() {}

  getScale(): number {
    const r = /scale\(\d+\.?\d*/g.exec(this.g.attr("transform"));
    if (r) {
      return Number(r[0].replace("scale(", "").replace(")", ""));
    }
    return 1;
  }
}
