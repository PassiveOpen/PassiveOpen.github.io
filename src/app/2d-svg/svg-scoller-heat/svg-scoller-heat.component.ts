import { HttpClient } from "@angular/common/http";
import { Component, AfterViewInit, ViewChild, ElementRef } from "@angular/core";
import * as d3 from "d3";
import { AppService } from "src/app/app.service";
import { HouseService } from "src/app/house/house.service";
import { BehaviorSubject, Subject, Subscription } from "rxjs";
import { Floor, Graphic, Section } from "src/app/components/enum.data";
import { TooltipService } from "src/app/components/tooltip/tooltip.service";
import { D3DistanceService } from "../d3Distance.service";
import { ContextMenuService } from "src/app/components/context-menu/context-menu.service";
import { D3Service } from "../d3.service";
import { SVGScroller } from "../svg-scroller.component";
import { xy } from "src/app/house/house.model";
import {
  Balloon,
  BalloonKey,
  BalloonLink,
  balloons,
} from "./balloon/balloon.model";
import { AppPath } from "src/app/model/path.model";
import { BaseSVG } from "src/app/model/base.model";
import { round } from "src/app/shared/global-functions";
type SVGEl = d3.Selection<SVGGElement, unknown, null, undefined>;

interface BalloonState {
  key: BalloonKey;
  coords?: xy;
  visible?: boolean;
  links?: BalloonLinkState[];
}

interface BalloonLinkState {
  target: BalloonKey;
  visible?: boolean;
  width?: number;
  text?: string;
}

@Component({
  selector: "app-svg-scoller-heat",
  templateUrl: "./svg-scoller-heat.component.html",
  styleUrls: ["./svg-scoller-heat.component.scss"],
})
export class SvgScrollerHeatComponent extends SVGScroller {
  graphic = Graphic.scrollerHeat;
  floor = Floor.all;
  marginInMeters = [0, 0, 0, 0];
  marginInPixels = [64, 64, 0, 0];

  elect: SVGEl;
  heath: SVGEl;

  maxLinks = 10;

  balloons = balloons;
  parts: any[] = [];
  solarNetCurve = {};

  subscriptions: Subscription[] = [];
  update$ = new Subject();

  constructor(
    public houseService: HouseService,
    public appService: AppService,
    public tooltipService: TooltipService,
    public host: ElementRef,
    public d3Service: D3Service,
    public d3DistanceService: D3DistanceService,
    public contextMenuService: ContextMenuService
  ) {
    super(appService, tooltipService, host, d3Service);
  }

  override localAfterViewInit() {
    const [width, height] = this.getSVGSizes();

    this.balloons.forEach((balloon) => {
      if (balloon === undefined) return;
      balloon.init(this.g, width, height);
      balloon.links.forEach((x) =>
        x.init(this.g, this.getBalloon(x.targetKey))
      );
    });
    const balloonSolar = this.getBalloon(BalloonKey.solar);
    const balloonNet = this.getBalloon(BalloonKey.net);
    setInterval((_) => {
      this.update$.next(undefined);
    }, 1000);

    this.subscriptions.push(
      ...[
        this.update$.subscribe((_) => {
          this.curveSolarNet(balloonSolar, balloonNet);
        }),
      ]
    );
    this.update$.next(undefined);
    this.afterSection();
  }

  override afterSection() {
    if (this.balloons[0].g === undefined) return;
    const margin = 40;
    const height = 64;
    const width = height * 1.618; //phi

    const rows = {
      [-2]: -(width + margin) * 2,
      [-1]: -(width + margin) * 1,
      0: 0,
      1: (width + margin) * 1,
      2: (width + margin) * 2,
    };
    const col = {
      [-2]: -(height + margin) * 2,
      [-1]: -(height + margin) * 1,
      0: 0,
      1: (height + margin) * 1,
      2: (height + margin) * 2,
    };

    const base: BalloonState[] = [
      {
        key: BalloonKey.electricity,
        coords: [rows[-1], col[-1]],
      },
      { key: BalloonKey.thermal, coords: [rows[-1], col[1]] },
    ];

    if (this.section === Section.energyUsage) {
      this.moveToObj([
        {
          key: BalloonKey.electricity,
          coords: [rows[0], col[-1]],
          links: [
            {
              target: BalloonKey.thermal,
              width: 16,
              text: `>80%`,
            },
            { target: BalloonKey.washingMachine, width: 2 },
            { target: BalloonKey.lights, width: 2 },
          ],
        },
        {
          key: BalloonKey.thermal,
          coords: [rows[0], col[2]],
          links: [
            { target: BalloonKey.hotWater, width: 2 },
            { target: BalloonKey.heating, width: 14 },
          ],
        },

        {
          key: BalloonKey.washingMachine,
          coords: [rows[1], col[-2]],
        },

        { key: BalloonKey.lights, coords: [rows[1], col[-1]] },

        {
          key: BalloonKey.hotWater,
          coords: [rows[1], col[2]],
        },
        {
          key: BalloonKey.heating,
          coords: [rows[1], col[1]],
        },
      ]);
    } else if (
      [
        Section.energyProduction,
        Section.energyProductionProblem1,
        Section.energyProductionProblem2,
      ].includes(this.section)
    ) {
      this.moveToObj([
        {
          key: BalloonKey.electricity,
          coords: [rows[0], col[-1]],
          links: [{ target: BalloonKey.heatPump, width: 2 }],
        },
        {
          key: BalloonKey.thermal,
          coords: [rows[0], col[2]],
          links: [],
        },

        {
          key: BalloonKey.heatPump,
          coords: [rows[0], col[0]],
          links: [{ target: BalloonKey.thermal, width: 2 }],
        },
        {
          key: BalloonKey.solar,
          coords: [rows[-1], col[-2]],
          links: [{ target: BalloonKey.electricity, width: 2 }],
        },
        {
          key: BalloonKey.net,
          coords: [rows[1], col[-2]],
          links: [{ target: BalloonKey.electricity, width: 2 }],
        },
      ]);
    } else if (this.section === Section.energyStorage) {
      this.moveToObj([
        {
          key: BalloonKey.electricity,
          coords: [rows[0], col[-1]],
          links: [{ target: BalloonKey.heatPump, width: 2 }],
        },
        {
          key: BalloonKey.heatPump,
          coords: [rows[0], col[0]],
          links: [{ target: BalloonKey.tank, width: 2 }],
        },
        {
          key: BalloonKey.tank,
          coords: [rows[0], col[1]],
          links: [{ target: BalloonKey.thermal, width: 2 }],
        },
        {
          key: BalloonKey.thermal,
          coords: [rows[0], col[2]],
          links: [
            { target: BalloonKey.hotWater, width: 2 },
            { target: BalloonKey.heating, width: 2 },
          ],
        },

        {
          key: BalloonKey.battery,
          coords: [rows[+1], col[-1]],
          links: [{ target: BalloonKey.electricity, width: 2 }],
        },
      ]);
    } else {
      this.moveToObj(base);
    }
  }

  getBalloon(key: BalloonKey) {
    const balloon = this.balloons.find((x) => x.key === key);
    if (balloon === undefined) {
      console.error("balloon not found", key);
      return;
    }
    return balloon;
  }

  moveToObj(BalloonStates: BalloonState[]) {
    console.log("moveToObj");

    this.balloons.forEach((balloon: Balloon) => {
      const state = BalloonStates.find((o) => o.key === balloon.key);
      this.updateBalloonProperties(balloon, state);
    });
    this.balloons.forEach((balloon: Balloon) => {
      const state = BalloonStates.find((o) => o.key === balloon.key);
      this.updateBalloonLinkProperties(balloon, state?.links || []);
      balloon.update();
    });
  }
  updateBalloonProperties(balloon: Balloon, state: BalloonState) {
    const [width, height] = this.getSVGSizes();
    if (state === undefined) {
      balloon.visible = false;
    } else {
      const x = state.coords[0];
      const y = state.coords[1];

      balloon.x = x > 0 && x <= 1 ? width * x : width / 2 + x;
      balloon.y = y > 0 && y <= 1 ? height * y : height / 2 + y;
      balloon.visible = state.visible !== undefined ? state.visible : true;
    }
  }
  updateBalloonLinkProperties(balloon: Balloon, states: BalloonLinkState[]) {
    balloon.links.forEach((link) => {
      const state = states.find((s) => s.target === link.targetKey);

      if (
        state === undefined ||
        !(link.balloon.isVisible && link.target.isVisible)
      ) {
        link.visible = false;
      } else {
        link.visible = true;
        link.width = state.width;
        link.text = state.text;
      }
    });
  }

  curveSolarNet(balloonSolar: Balloon, balloonNet: Balloon) {
    const t = this.svg.transition().duration(750);
    this.svg
      .select<SVGGElement>("#solar-net-curve")
      .selectAll("path")
      .data(() => [undefined])
      .join(
        (enter) =>
          enter
            .append("path")
            .attr("fill", "transparent")
            .attr("marker-end", "url(#head)"),
        (update) =>
          update
            .call((update) => update.transition(t))
            .attr("d", (d) => {
              console.log("update poath", d);
              const offset = 64;
              const x1 = balloonSolar.x + offset;
              const y1 = balloonSolar.y;
              const x2 = balloonNet.x - offset;
              const y2 = balloonNet.y;

              const xp1 = (x2 - x1) * (1 / 3) + x1;
              const yp1 = y1 + 50;
              const xp2 = (x2 - x1) * (2 / 3) + x1;
              const yp2 = y2 + 50;

              return `M ${x1} ${y1} C ${xp1} ${yp1}, ${xp2} ${yp2}, ${x2} ${y2}`;

              // return `M  L 200 ${round(
              //   d,
              //   0
              // )}`;
            })
      );
  }
}
