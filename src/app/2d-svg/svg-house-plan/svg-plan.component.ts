import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  HostListener,
} from "@angular/core";
import { AppService } from "src/app/app.service";
import { HouseService } from "src/app/house/house.service";
import { BehaviorSubject, take } from "rxjs";
import { BasicSVG } from "src/app/2d-svg/base-svg.component";
import { Graphic, Section, SensorType } from "src/app/components/enum.data";
import { TooltipService } from "src/app/components/tooltip/tooltip.service";
import {
  angleXY,
  offset,
  ptToScale,
  round,
} from "src/app/shared/global-functions";
import { HttpClient } from "@angular/common/http";
import * as d3 from "d3";
import { xy } from "src/app/house/house.model";
import { ContextMenuService } from "src/app/components/context-menu/context-menu.service";
import { D3Service, SvgLoader } from "../d3.service";
import { D3DistanceService } from "../d3Distance.service";
import { AppPolygon } from "src/app/model/polygon.model";
import { PrintService } from "../print.service";

@Component({
  selector: "app-svg-plan",
  templateUrl: "./svg-plan.component.html",
  styleUrls: ["./svg-plan.component.scss"],
})
export class SvgComponent extends BasicSVG implements AfterViewInit, OnDestroy {
  @ViewChild("render") renderEl: ElementRef<HTMLImageElement>;

  @HostListener("window:keydown", ["$event"])
  async handleKeyboardEvent(event: KeyboardEvent) {
    const key = event.key;
    if (event.ctrlKey && key === "z") {
      console.clear();
      event.preventDefault();
      this.printService.print(this);
    }
  }
  marginInMeters = [0, 0, 0, 0];
  marginInPixels = [16 + 56, 64, 64, 8];

  gridSizeX$ = new BehaviorSubject(100);
  gridSizeY$ = new BehaviorSubject(100);

  roomKeys = this.houseService.roomKeys;
  doorKeys = this.houseService.doorKeys;
  wallKeys = this.houseService.wallKeys;
  windowKeys = this.houseService.windowKeys;
  sensorKeys = this.houseService.sensorKeys;
  exampleKeys = this.houseService.exampleKeys;

  SensorTypes = Object.values(SensorType);

  graphic = Graphic.house2D;
  transformOrigin = [0, 0];

  renderImg;
  svgLoaders: SvgLoader[] = [];

  constructor(
    public houseService: HouseService,
    public appService: AppService,
    public tooltipService: TooltipService,
    public host: ElementRef,
    public d3Service: D3Service,
    public d3DistanceService: D3DistanceService,
    public contextMenuService: ContextMenuService,
    public printService: PrintService
  ) {
    super(
      houseService,
      appService,
      tooltipService,
      host,
      d3Service,
      d3DistanceService,
      contextMenuService
    );
  }

  override svgSpecificUpdate() {
    const scroll = this.appService.scroll$.value;
    if (this.appService.fullscreen$.value === true) return;
    if (scroll.section === Section.welcome) {
      this.setTransform("translate(-1, -4) scale(0.8)", 1000);
      this.showingImage = true;
    } else {
      this.setTransform(undefined, 1000);
      this.showingImage = false;
    }
  }

  addLayout(firstDate = "2023-01-01") {
    // Scale works with 1cm paper = 1 meter in Plan
    // Most sizes here are in cm on printed paper
    const margin = 1;
    const g = this.g.append("g").attr("class", "print-layout");
    g.attr("transform", `translate(-2,-2) scale(1)`);
    const paper = [21.0, 29.7];
    const printableWidth = paper[1] - margin * 2;
    const printableHeight = paper[0] - margin * 2;
    const x = margin;
    const y = margin;
    const fontSize1 = ptToScale(10, 0, true);
    const fontSize2 = ptToScale(12, 0, true);
    const fontSize3 = ptToScale(18, 0, true);
    const color = "black";
    g.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", paper[1])
      .attr("height", paper[0])
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1 * this.meterPerPixel);
    g.append("rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", printableWidth)
      .attr("height", printableHeight)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2 * this.meterPerPixel);

    const blockWidth = 9;
    const blockHeight = 2.8;

    const textBlock = () => {
      const textMargin = 0.2;
      const divider = textMargin * 2;
      const blockX = x + printableWidth - blockWidth;
      const blockY = y + printableHeight - blockHeight;
      g.append("rect")
        .attr("fill", "white")
        .attr("stroke", color)
        .attr("stroke-width", 2 * this.meterPerPixel)
        .attr("x", blockX)
        .attr("y", blockY)
        .attr("width", blockWidth)
        .attr("height", blockHeight);
      g.append("line")
        .attr("x1", blockX + textMargin)
        .attr("y1", y + printableHeight - divider - textMargin)
        .attr("x2", x + printableWidth - textMargin)
        .attr("y2", y + printableHeight - divider - textMargin)
        .attr("stroke", color)
        .attr("stroke-width", 1 * this.meterPerPixel);

      const t = g
        .append("text")
        .attr("fill", color)
        .attr("font-size", fontSize1)
        .attr("font-family", "sans-serif");

      t.clone()
        .attr("x", y + printableWidth - textMargin)
        .attr("y", blockY - 0.1)
        .attr("font-size", fontSize2)
        .attr("text-anchor", "end")
        .text(`Förhandsbesked`);

      t.clone()
        .attr("x", y + printableWidth - textMargin)
        .attr("y", blockY + textMargin * 3)
        .attr("font-size", fontSize3)
        .attr("text-anchor", "end")
        .attr("font-weight", "bold")
        .text(`Passive House ${this.house.name}`);

      t.clone()
        .attr("x", blockX + blockWidth - textMargin)
        .attr("y", blockY + textMargin * 6)
        .attr("font-size", fontSize2)
        .attr("text-anchor", "end")
        .text(`Floor plan Top floor`);

      t.clone()
        .attr("x", blockX + blockWidth - textMargin)
        .attr("y", y + printableHeight - divider - textMargin * 2)
        .attr("text-anchor", "end")
        .text(`Scale 1:100`);

      t.clone()
        .attr("x", blockX + blockWidth / 2 + textMargin)
        .attr("y", y + printableHeight - divider - textMargin * 2)
        .attr("text-anchor", "middle")
        .text(`REV: ${new Date().toISOString().slice(0, 10)}`);

      t.clone()
        .attr("x", blockX + textMargin)
        .attr("y", y + printableHeight - divider - textMargin * 2)
        .attr("font-size", fontSize2)
        .attr("text-anchor", "start")
        .text("Drawing A1");

      t.clone()
        .attr("x", blockX + textMargin)
        .attr("y", y + printableHeight - textMargin)
        .attr("text-anchor", "start")
        .text(firstDate);

      t.clone()
        .attr("x", x + printableWidth - textMargin)
        .attr("y", y + printableHeight - textMargin)
        .attr("text-anchor", "end")
        .text("Drawn by: GeoDev AB");
    };
    const northArrow = () => {
      const arrow = g
        .append("g")
        .attr(
          "transform",
          `translate(${x + printableWidth - 0.5}, ${
            y + printableHeight - blockHeight - 1.2
          })`
        );

      arrow
        .append("text")
        .attr("fill", color)
        .attr("font-size", fontSize1)
        .attr("x", 0)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .text("N");

      arrow
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 0.5)
        .attr("stroke", color)
        .attr("stroke-width", 2 * this.meterPerPixel);
      arrow

        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0.1)
        .attr("y2", 0.1)
        .attr("stroke", color)
        .attr("stroke-width", 2 * this.meterPerPixel);
      arrow

        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", -0.1)
        .attr("y2", 0.1)
        .attr("stroke", color)
        .attr("stroke-width", 2 * this.meterPerPixel);
    };

    const scaleBar = () => {
      const scaleBar = g
        .append("g")
        .attr(
          "transform",
          `translate(${x + printableWidth - 1}, ${
            y + printableHeight - blockHeight - 1.2
          })`
        );

      const length = 4;

      [...Array(length + 1).keys()].forEach((_, i) => {
        scaleBar
          .append("line")
          .attr("x1", -i)
          .attr("y1", 0)
          .attr("x2", -i)
          .attr("y2", -0.1)
          .attr("stroke", color)
          .attr("stroke-width", 2 * this.meterPerPixel);
        scaleBar
          .append("text")
          .attr("fill", color)
          .attr("font-size", fontSize1 * 0.7)
          .attr("x", -i)
          .attr("y", 0.3)
          .attr("text-anchor", "middle")
          .attr("font-family", "sans-serif")
          .text(length - i);
      });
      scaleBar
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", -length)
        .attr("y2", 0)
        .attr("stroke", color)
        .attr("stroke-width", 2 * this.meterPerPixel);
      scaleBar
        .append("text")
        .attr("fill", color)
        .attr("font-size", fontSize1 * 0.8)
        .attr("x", -length)
        .attr("y", -0.3)
        .attr("text-anchor", "left")
        .attr("font-family", "sans-serif")
        .text("Meter");
    };
    scaleBar();
    textBlock();
    northArrow();
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
  }

  svgUpdateMarginAndSize() {
    this.gridSizeX$.next(this.house.gridSizeX);
    this.gridSizeY$.next(this.house.gridSizeY);
    const margin = this.house.studDistance * 3;
    this.marginInMeters = [margin, margin, margin, margin];
    this.svgHouseSize = [
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
