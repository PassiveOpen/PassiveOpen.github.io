import { AfterViewInit, Component, ElementRef, ViewChild } from "@angular/core";

import {
  BehaviorSubject,
  catchError,
  merge,
  of,
  Subscription,
  tap,
  throttleTime,
} from "rxjs";
import * as d3 from "d3";
import { AppService } from "../app.service";
import { HouseService } from "../house/house.service";
import { TooltipService } from "../components/tooltip/tooltip.service";
import { D3Service } from "./d3.service";
import { Graphic, Section, Tag } from "../components/enum.data";
import { xy } from "../house/house.model";
@Component({
  selector: "app-svg-scroller",
  template: "",
})
export class SVGScroller implements AfterViewInit {
  @ViewChild("svg") svgEl: ElementRef<SVGElement>;
  svg: d3.Selection<SVGElement, unknown, null, undefined>;
  g: d3.Selection<SVGGElement, unknown, null, undefined>;

  resize$ = new BehaviorSubject(undefined);
  subscriptions: Subscription[] = [];
  observer: ResizeObserver;

  graphic: Graphic;
  section: Section;
  tags = Object.values(Tag);
  tag: Tag;
  loaded = false;

  constructor(
    // public houseService: HouseService,
    public appService: AppService,
    public tooltipService: TooltipService,
    public host: ElementRef,
    public d3Service: D3Service
  ) {}

  ngAfterViewInit(): void {
    this.setUp();
    this.localAfterViewInit();
  }
  localAfterViewInit() {}
  afterSection() {}

  setTransform(transform: any = "translate(0,0) scale(1)", duration = 10000) {
    if (this.loaded) {
      this.appService.setTransformCookie(transform, this.graphic);
    }
    this.g.transition().duration(duration).attr("transform", transform);
  }

  getSVGSizes() {
    const svg = this.svg.node();
    const width = svg.clientWidth;
    const height = svg.clientHeight;
    return [width, height] as xy;
  }
  setUp() {
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
          this.resize$.pipe(
            throttleTime(10),
            tap((x) => this.afterSection())
          ),
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

              if (scroll.section !== this.section) {
                this.section = scroll.section;

                if (this.section === undefined) return;
                this.afterSection();
              }
            })
          )
        ).subscribe((x) => {}),
      ]
    );
  }
}
