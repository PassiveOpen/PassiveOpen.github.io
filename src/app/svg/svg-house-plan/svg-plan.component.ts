import {
  Component,
  AfterViewInit,
  ElementRef,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ViewChild,
  HostListener,
} from '@angular/core';
import { AppService } from 'src/app/app.service';
import { HouseService } from 'src/app/house/house.service';
import { BehaviorSubject, take } from 'rxjs';
import { BasicSVG } from 'src/app/svg/base-svg.component';
import { Graphic, Section, SensorType } from 'src/app/components/enum.data';
import { TooltipService } from 'src/app/components/tooltip/tooltip.service';
import { round } from 'src/app/shared/global-functions';
import { HttpClient } from '@angular/common/http';
import * as d3 from 'd3';
import { D3Service, SvgLoader } from '../d3.service';

@Component({
  selector: 'app-svg-plan',
  templateUrl: './svg-plan.component.html',
  styleUrls: ['./svg-plan.component.scss'],
})
export class SvgComponent extends BasicSVG implements AfterViewInit, OnDestroy {
  @ViewChild('render') renderEl: ElementRef<HTMLImageElement>;

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
  sun: SvgLoader;

  constructor(
    public houseService: HouseService,
    public appService: AppService,
    public tooltipService: TooltipService,
    public host: ElementRef,
    private httpClient: HttpClient,
    public d3Service: D3Service
  ) {
    super(houseService, appService, tooltipService, host, d3Service);
  }

  ngAfterViewInit(): void {
    this.sun = this.d3Service.loadSVG(
      'assets/models/sun.svg',
      '.g-sun',
      (selector) => {
        const house = this.house$.value;
        const size = 40 * this.meterPerPixel;
        d3.select(selector)
          .selectChild('svg')
          .attr('height', size + 'px')
          .attr('width', size + 'px')
          .attr('x', house.houseWidth / 2 + 'px')
          .attr('y', house.houseLength + house.studDistance * 1 + 'px');
      }
    );

    this.setUp();
    this.setStairs();

    this.renderImg = this.svg
      .select('.render-img')
      .attr('xlink:href', '/assets/img/top_render.jpg')
      .attr('x', -636)
      .attr('y', -354)
      .attr('width', 2)
      .attr('height', 2);
    d3.select('svg');
  }

  svgUpdateMarginAndSize() {
    this.sun.update();
    this.gridSizeX$.next(this.house.gridSizeX);
    this.gridSizeY$.next(this.house.gridSizeY);
    const margin = this.house.studDistance * 3;
    this.marginInMeters = [margin, margin, margin, margin];
    this.drawingSize = [
      [0, -this.house.extensionToSouth],
      [this.house.houseWidth, this.house.houseLength],
    ];
    this.scaleRenderImage();
    this.scaleStairs();
  }

  setStairs() {
    const svg = document.querySelector('.svg-plan-stair-plan')
      .firstChild as SVGElement;

    const g = this.svg.select('.plan-stair-plan');

    this.svg.on('mousedown.drag', null);
    (g.select('.plan-stair-plan').node() as any).replaceWith(svg);
    svg.classList.add('plan-stair-plan');
    setTimeout(() => {
      this.updateSVG();
    }, 0);
  }
  scaleStairs() {
    this.svg
      .select('.plan-stair-plan')
      // .attr('transform', 'rotate(180)')
      .attr(
        'transform-origin',
        `${this.stair.stairOrigin[0] + this.stair.totalWidth / 2} ${
          this.house.stair.stairOrigin[1] + this.stair.totalHeight / 2
        }`
      );
  }
  scaleRenderImage() {
    const renderOrigin = [636, 394];
    const renderWidth = 535;
    const renderHeight = 495;
    const houseWidth = round(1, this.house.houseWidth / this.meterPerPixel);
    const houseHeight = round(1, this.house.houseLength / this.meterPerPixel);
    const scaleWidth = round(5, renderWidth / houseWidth);
    const scaleHeight = round(5, renderHeight / houseHeight);
    const scale = Math.max(scaleHeight, scaleWidth);
    if (!this.renderImg) {
      return;
    }
    this.renderImg
      .attr('x', -(renderOrigin[0] * this.meterPerPixel) / scale)
      .attr('y', -(renderOrigin[1] * this.meterPerPixel) / scale)
      .attr('width', (1920 * this.meterPerPixel) / scale)
      .attr('height', (1080 * this.meterPerPixel) / scale);
  }
}
