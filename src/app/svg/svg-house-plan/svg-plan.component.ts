import {
  Component,
  AfterViewInit,
  ElementRef,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ViewChild,
  HostListener,
} from "@angular/core";
import { AppService } from "src/app/app.service";
import { HouseService } from "src/app/house/house.service";
import { BehaviorSubject, take } from "rxjs";
import { BasicSVG } from "src/app/svg/base-svg.component";
import { Graphic, Section, SensorType } from "src/app/components/enum.data";
import { TooltipService } from "src/app/components/tooltip/tooltip.service";
import { angleXY, offset, round } from "src/app/shared/global-functions";
import { HttpClient } from "@angular/common/http";
import * as d3 from "d3";
import { xy } from "src/app/house/house.model";
import { ContextMenuService } from "src/app/components/context-menu/context-menu.service";
import { D3Service, SvgLoader } from "../d3.service";
import { D3DistanceService } from "../d3Distance.service";

@Component({
  selector: "app-svg-plan",
  templateUrl: "./svg-plan.component.html",
  styleUrls: ["./svg-plan.component.scss"],
})
export class SvgComponent extends BasicSVG implements AfterViewInit, OnDestroy {
  @ViewChild("render") renderEl: ElementRef<HTMLImageElement>;

  marginInMeters = [0, 0, 0, 0];
  marginInPixels = [16 + 56, 64, 64, 8];

  gridSizeX$ = new BehaviorSubject(100);
  gridSizeY$ = new BehaviorSubject(100);

  roomKeys = this.houseService.roomKeys;
  doorKeys = this.houseService.doorKeys;
  wallKeys = this.houseService.wallKeys;
  windowKeys = this.houseService.windowKeys;
  sensorKeys = this.houseService.sensorKeys;

  SensorTypes = Object.values(SensorType);

  graphic = Graphic.plan;
  transformOrigin = [0, 0];

  renderImg;
  svgLoaders: SvgLoader[] = [];

  constructor(
    public houseService: HouseService,
    public appService: AppService,
    public tooltipService: TooltipService,
    public host: ElementRef,
    private httpClient: HttpClient,
    public d3Service: D3Service,
    public d3DistanceService: D3DistanceService,
    public contextMenuService: ContextMenuService
  ) {
    super(
      houseService,
      appService,
      tooltipService,
      host,
      d3Service,
      d3DistanceService,
      contextMenuService,
    );
  }

  override svgSpecificUpdate() {
    const scroll = this.appService.scroll$.value;
    if (this.appService.fullscreen$.value === true) return;
    if (scroll.section === Section.welcome) {
      this.g.attr("transform", "transform: scale(0.4) translateX(40%)");
      this.showingImage = true;
    } else {
      this.showingImage = false;
      this.g.attr("transform", "");
    }
  }

  ngAfterViewInit(): void {
    this.svgLoaders.push(
      this.d3Service.loadSVG("assets/models/sun.svg", ".g-sun", (selector) => {
        const house = this.house$.value;
        const size = 40 * this.meterPerPixel;
        d3.select(selector)
          .selectChild("svg")
          .attr("height", size + "px")
          .attr("width", size + "px")
          .attr("x", house.houseWidth / 2 + "px")
          .attr("y", house.houseLength + house.studDistance * 1 + "px");
      })
    );
    for (let sensor of Object.values(SensorType)) {
      this.svgLoaders.push(
        this.d3Service.loadSVG(
          `assets/svg/${sensor}.svg`,
          `#icon-${sensor}`,
          (selector) => {
            const house = this.house$.value;
            const size = 20 * this.meterPerPixel;
            d3.select(selector)
              .selectChild("svg")
              .attr("x", -size / 2 + "px")
              .attr("y", -size / 2 + "px")
              .attr("height", size + "px")
              .attr("width", size + "px");
          }
        )
      );
    }

    this.setUp();
    this.setStairs();

    this.renderImg = this.svg
      .select(".render-img")
      .attr("xlink:href", "/assets/img/top_render.jpg");

    this.scaleRenderImage();
    d3.select("svg");
  }

  svgUpdateMarginAndSize() {
    this.gridSizeX$.next(this.house.gridSizeX);
    this.gridSizeY$.next(this.house.gridSizeY);
    const margin = this.house.studDistance * 3;
    this.marginInMeters = [margin, margin, margin, margin];
    this.drawingSize = [
      [0, 0],
      [this.house.houseWidth, this.house.houseLength],
    ];
    this.scaleRenderImage();
    this.scaleStairs();
    this.svgLoaders.forEach((x) => x.update());
  }

  setStairs() {
    const svg = document.querySelector(".svg-plan-stair-plan")
      .firstChild as SVGElement;

    const g = this.svg.select(".plan-stair-plan");

    // this.svg.on("mousedown.drag", null);
    (g.select(".plan-stair-plan").node() as any).replaceWith(svg);
    svg.classList.add("plan-stair-plan");
  }

  scaleStairs() {
    this.svg
      .select(".plan-stair-plan")
      // .attr('transform', 'rotate(180)')
      .attr(
        "transform-origin",
        `${this.stair.stairOrigin[0] + this.stair.totalWidth / 2} ${
          this.house.stair.stairOrigin[1] + this.stair.totalHeight / 2
        }`
      );
  }

  scaleRenderImage() {
    const s = this.house.stramien.out;

    const renderOrigin: xy = [582, 240]; // 0,0
    const renderWidth = 549; // measured by hand
    const renderHeight = 481;

    const totalRenderWidth = 1920;
    const totalRenderHeight = 1080;

    const houseWidth = round(this.house.houseWidth / this.meterPerPixel);
    const houseHeight = round(this.house.houseLength / this.meterPerPixel);
    const houseOrigin: xy = [0, 0];

    const scaleWidth = round(renderWidth / houseWidth, 5);
    const scaleHeight = round(renderHeight / houseHeight, 5);
    const scale = Math.max(scaleHeight, scaleWidth);

    if (!this.renderImg) {
      return;
    }

    const toMeters = (pixel: xy): xy => {
      return [
        houseOrigin[0] - round((pixel[0] * this.meterPerPixel) / scale),
        houseOrigin[1] - round((pixel[1] * this.meterPerPixel) / scale),
      ];
    };

    const toPixels = (xy: xy): xy => {
      return [
        round(xy[0] / this.meterPerPixel, 4),
        round(xy[1] / this.meterPerPixel, 4),
      ];
    };

    /**
     *
     * @param xy Real world coordinates
     * @returns percentage in this image
     */
    const parse = (xy: xy) => {
      const pixel = toPixels(xy);
      return [
        ((pixel[0] * scale + renderOrigin[0]) / totalRenderWidth) * 100,
        ((pixel[1] * scale + renderOrigin[1]) / totalRenderHeight) * 100,
      ]
        .map((x) => `${round(x, 0)}%`)
        .join(" ");
    };

    const clip: xy[] = [
      angleXY(45, 100, [s.we.d, s.ns.c]),
      [s.we.d, s.ns.c],
      [s.we.b + (s.we.c - s.we.b) / 2, s.ns.b + (s.ns.c - s.ns.b) / 2],
      [s.we.b, s.ns.b],
      angleXY(180 + 20, 100, [s.we.b, s.ns.b]),
    ];

    const renderOriginMeter = toMeters(renderOrigin);
    this.renderImg
      .attr("x", renderOriginMeter[0])
      .attr("y", renderOriginMeter[1])
      .attr("width", (1920 * this.meterPerPixel) / scale)
      .attr("height", (1080 * this.meterPerPixel) / scale)
      .attr(
        "clip-path",
        `polygon(
0% 0%,
100% 0%,
100% 100%,
${clip.map((x) => parse(x)).join(", \n")}
      )`
      );

    // clip-path: polygon(
    //   0% 0%,
    //   100% 0%,
    //   100% 130%,
    //   51.7% 78.7%,
    //   51.7% 52.9%,
    //   42.4% 36.5%,
    //   33.1% 36.5%
    // );
  }
}
