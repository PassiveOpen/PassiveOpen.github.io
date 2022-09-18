import {
  Component,
  ElementRef,
  HostListener,
  Input,
  ViewChild,
} from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  concatAll,
  filter,
  first,
  from,
  merge,
  mergeMap,
  of,
  Subscription,
  tap,
  throttleTime,
} from 'rxjs';
import { AppService } from 'src/app/app.service';
import { HouseService } from 'src/app/house/house.service';
import { round } from 'src/app/shared/global-functions';
import { Graphic, Section, Tag } from '../components/enum.data';
import { TooltipService } from '../components/tooltip/tooltip.service';
import { House } from '../house/house.model';
import * as d3 from 'd3';
import { Cross } from '../house/cross.model';
import { Stair } from '../house/stairs.model';
import { D3Service } from './d3.service';
import { ZoomTransform } from 'd3';

@Component({
  selector: 'app-svg-base',
  template: '',
})
export class BasicSVG {
  @HostListener('click', ['$event']) onClick(e: PointerEvent) {
    const getID = (el): string => {
      if (!el || el === this.svgEl.nativeElement) {
        return;
      }
      if ('id' in el && `${el.id}`.length > 0) {
        return el.id;
      } else {
        return getID(el.parentNode);
      }
    };

    const id = getID(e.target);

    const exit = () => {
      this.tooltipService.detachOverlay();
      document.body.classList.remove('selection-active');
      document.querySelectorAll('svg .selected').forEach((d, i) => {
        d.classList.remove('selected');
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
        'probably its only a part of its full ID'
      );
      return exit();
    }
    document.body.classList.add('selection-active');
    obj.select();

    this.tooltipService.attachPopup([e.pageX, e.pageY], obj);
  }

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

  @ViewChild('svg') svgEl: ElementRef<SVGElement>;
  svg: d3.Selection<SVGElement, unknown, null, undefined>;
  g: d3.Selection<SVGGElement, unknown, null, undefined>;

  resize$ = new BehaviorSubject(undefined);
  subscriptions: Subscription[] = [];
  observer: ResizeObserver;

  drawingSize = [
    [0, 0],
    [200, 100],
  ];

  loaded = false;

  constructor(
    public houseService: HouseService,
    public appService: AppService,
    public tooltipService: TooltipService,
    public host: ElementRef,
    public d3Service: D3Service
  ) {}

  //// LifeCicle ////

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    if (this.observer) this.observer.unobserve(this.host.nativeElement);
    console.log('destroy', this.graphic);
    this.houseService.destroyParts();
  }
  svgUpdateMarginAndSize() {}

  setUp() {
    this.svg = d3.select<SVGElement, undefined>(this.svgEl.nativeElement);
    this.g = this.svg.select('g');
    // resize
    this.observer = new ResizeObserver((x) => this.resize$.next(x));
    this.observer.observe(this.host.nativeElement);

    this.resize$.pipe(
      catchError((e) => {
        return of(undefined);
      })
    );

    this.subscriptions.push(
      merge(
        this.house$.pipe(
          tap((x) => {
            const house = this.house$.value;
            this.house = house;
            this.cross = house.cross;
            this.stair = house.stair;
          })
        ),
        this.appService.update$,
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
        this.appService.fullscreen$.pipe(
          tap((fullscreen) => {
            if (fullscreen) {
              // ToDo check
              this.svg.call(
                d3.zoom().on('zoom', (e) => {
                  this.setTransform(e.transform, 0);
                })
              );
            } else {
              this.svg.on('.zoom', null);
              this.setTransform();
            }
          })
        ),
        this.resize$.pipe(
          throttleTime(10)
          // tap((x) => console.log('scroll'))
        ),
        this.appService.scroll$.pipe(
          tap((x) => {
            const scroll = this.appService.scroll$.value;
            this.section = scroll.section;
          })
        )
      )
        .pipe(
          filter((x) => {
            return this.house !== undefined;
          })
        )
        .subscribe((x) => {
          this.updateSVG();
        })
    );

    this.loaded = true;
  }

  setTransform(transform: any = 'translate(0,0) scale(1)', duration = 100) {
    if (this.loaded) {
      this.appService.setTransformCookie(transform, this.graphic);
    }
    // console.log('set ', transform);
    this.g
      .transition()
      .duration(duration)
      .attr('transform', transform)
      .on('end', () => this.updateSVG());
  }

  updateSVG() {
    // console.log('updateSVG');

    this.tooltipService.updateOverlay();
    this.svgUpdateMarginAndSize();

    const [[x, y], [maxX, maxY]] = this.drawingSize;
    const minX = -this.marginInMeters[3] + x;
    const minY = -this.marginInMeters[0] + y;
    const widthMeter = maxX + this.marginInMeters[3] + this.marginInMeters[1];
    const heightMeter = maxY + this.marginInMeters[0] + this.marginInMeters[2];

    const svgW = Math.abs(
      round(0, this.svgEl.nativeElement.clientWidth) -
        this.marginInPixels[1] -
        this.marginInPixels[3]
    );
    const svgH = Math.abs(
      round(0, this.svgEl.nativeElement.clientHeight) -
        this.marginInPixels[0] -
        this.marginInPixels[2]
    );
    const scaleW = round(5, widthMeter / svgW);
    const scaleH = round(5, heightMeter / svgH);
    this.meterPerPixel = Math.max(scaleW, scaleH) / this.getScale();

    // console.log('updateSVG', Math.max(scaleW, scaleH), this.getScale());
    const margin = this.marginInPixels.map((x) =>
      round(4, x * this.meterPerPixel)
    );

    if (!this.isChild) {
      this.setLines();
      this.svg
        // .transition()
        // .duration(1000)
        .attr(
          'viewBox',
          `
        ${-margin[3] + minX} 
        ${-margin[0] + minY} 
        ${Math.abs(widthMeter + (margin[3] + margin[1]))} 
        ${Math.abs(heightMeter + (margin[0] + margin[2]))}`
        )
        .on('end', () => this.setLines());
    }

    this.house.redrawHouse(
      this.appService.floor$.value,
      this.graphic,
      this.meterPerPixel
    );
  }

  getScale(): number {
    const r = /scale\(\d+\.?\d*/g.exec(this.g.attr('transform'));
    if (r) {
      return Number(r[0].replace('scale(', '').replace(')', ''));
    }
    return 1;
  }

  setLines() {
    // console.log('setLines');
    // this.svgEl.nativeElement
    //   .querySelectorAll('*[stroke-width]')
    //   .forEach((el: SVGElement) => {
    //     const strokeWidth = el.getAttribute('stroke-width');
    //     const currentWidth = Number(strokeWidth);
    //     el.style.strokeWidth = `${this.meterPerPixel * currentWidth}`;
    //   });
    // this.svgEl.nativeElement
    //   .querySelectorAll('*[stroke-dasharray]')
    //   .forEach((el: SVGElement) => {
    //     const currentWidth = Number(el.getAttribute('stroke-dasharray'));
    //     el.style.strokeDasharray = `${
    //       this.meterPerPixel * currentWidth * 0.5
    //     } ${this.meterPerPixel * currentWidth}`;
    //   });
    this.svgEl.nativeElement
      .querySelectorAll('.scale-icon>svg')
      .forEach((el: SVGElement) => {
        const newScale = Math.round(this.meterPerPixel * 32 * 64);
        el.setAttribute('height', `${newScale}px`);
        el.setAttribute('width', `${newScale}px`);
        el.setAttribute('x', `${-newScale / 2}px`);
        el.setAttribute('y', `${-newScale / 2}px`);
      });
    this.svgEl.nativeElement
      .querySelectorAll('.scale-icon>*:not(svg)')
      .forEach((el: SVGElement) => {
        const newScale = round(3, this.meterPerPixel * 32);
        el.setAttribute('transform', `scale(${newScale})`);
      });
    // this.svgEl.nativeElement
    //   .querySelectorAll('*[font-size]')
    //   .forEach((el: SVGElement) => {
    //     if (`${el.getAttribute('class')}`.includes('sensor-badge-text')) return;
    //     const currentSize = Number(el.getAttribute('font-size'));
    //     el.style.fontSize = `${this.meterPerPixel * currentSize}`;
    //   });
  }
}
