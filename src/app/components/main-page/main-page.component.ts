import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Renderer2,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { tap, filter, map } from 'rxjs';
import { AppService } from 'src/app/app.service';
import { RoofStyle } from 'src/app/house/cross.model';
import { HouseService } from 'src/app/house/house.service';
import { VisibleService } from 'src/app/house/visible.service';
import { animationFallInOut, animationSlideInOut } from '../animations';
import { Graphic, GraphicSide, State, Section, Tag } from '../enum.data';
import { TooltipService } from '../tooltip/tooltip.service';

@Component({
  selector: 'app-main-page',
  styleUrls: ['./main-page.component.scss'],
  templateUrl: './main-page.component.html',
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
  cssStates$ = this.states$.pipe(
    map((tags) => tags.map((tag) => `state-${tag}`).join(' '))
  );

  @HostListener('window:scroll', ['$event'])
  isScrolledIntoView() {
    this.calcSection();
  }

  constructor(
    private appService: AppService,
    private tooltipService: TooltipService,
    private houseService: HouseService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private visibleService: VisibleService // creates a instance of this service
  ) {}

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
    this.sectionEls = document.querySelectorAll<HTMLElement>('section');
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
    const tag = params['tag'];
    if (tag) this.tag$.next(tag);
  }

  calcSection() {
    this.section = this.getSection();
    if (this.section === undefined) return;
    this.graphic = this.setGraphic(this.section);
    this.graphicSide = this.getSide();
    this.updateStateBasedOnSection(this.section);

    document
      .querySelector(`section#${this.section}`)
      .classList.add('section-active');

    this.appService.scroll$.next({
      scroll: Math.round(window.pageYOffset),
      percentage: this.getVerticalScrollPercentage(document.body),
      section: this.section,
      graphicSide: this.graphicSide,
      graphic: this.graphic,
    });

    const queryParams: Params = {
      section: this.section,
      // states: this.states$.value,
    };
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: queryParams,
      replaceUrl: true,
      queryParamsHandling: 'merge', // remove to replace all query params by provided
    });
  }

  getVerticalScrollPercentage(elm) {
    var p = elm.parentNode;
    return (
      Math.round(
        ((elm.scrollTop || p.scrollTop) / (p.scrollHeight - p.clientHeight)) *
          1e3
      ) / 1e3
    );
  }

  setGraphic(section: Section): Graphic {
    let graphic;
    if (
      [
        Section.welcome,
        Section.passiv,
        Section.basics,
        Section.extensions,
        Section.tower,
        Section.wiredPower,
        Section.wiredEthernet,
        Section.wiredExtra,
        Section.wiredLight,
        Section.wiredSafety,
      ].includes(section)
    ) {
      graphic = Graphic.plan;
      // this.appService.setStates(State.stramien, true); // DEV
      this.appService.setStates(State.grid, true); // DEV
      // this.appService.setStates(State.towerFootprint, true); // DEV
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
        this.houseService.update('cross', 'viewedRoofStyle', RoofStyle.roof70);
      }
      if ([Section.roofBasics, Section.roofCircle].includes(section)) {
        this.houseService.update(
          'cross',
          'viewedRoofStyle',
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
      graphic = Graphic.stair;
    }
    if (
      [Section.facadeStart, Section.facadeWindow, Section.facadeDoor].includes(
        section
      )
    ) {
      graphic = Graphic.none;
    }
    if (
      [
        Section.contructionCrawlerSpace,
        Section.contructionFloor,
        Section.contructionFoundation,
        Section.contructionRoof,
        Section.contructionWall,
        Section.contructionWallFinish,
      ].includes(section)
    ) {
      graphic = Graphic.window;
    }
    if (
      [
        Section.instaltionDrinkWater,
        Section.instaltionElectricity,
        Section.instaltionGreyWater,
        Section.instaltionHeating,
        Section.instaltionSmartHome,
        Section.instaltionVentilation,
      ].includes(section)
    ) {
      graphic = Graphic.none;
    }
    if (this.graphic !== graphic) {
      console.log('Swap side!');
      this.tooltipService.detachOverlay();
    }
    this.graphic = graphic;
    return graphic;
  }

  updateStateBasedOnSection(section: Section) {
    this.appService.setStates(State.grey, [Section.roofEdge].includes(section));

    this.appService.setStates(
      State.measure,
      [Section.basics, Section.roof70, Section.roofCircle].includes(section)
    );
  }

  getSection(): Section {
    var windowHalf = Math.round(window.innerHeight * this.goalLine);
    var windowTop = Math.round(window.pageYOffset);
    var goalLine = windowTop + windowHalf;
    this.sectionEls.forEach((el) => {
      const id = el.id;
      this.sectionScroll[id].past = this.sectionScroll[id].top < goalLine;
      el.classList.remove('section-active');
    });
    const next = Object.values(this.sectionScroll)
      .filter((x) => x.past)
      .sort((a, b) => b.top - a.top);
    return next && next[0] ? next[0].id : undefined;
  }

  getSide(): GraphicSide {
    const graphicSide = [Graphic.cross].includes(this.graphic)
      ? GraphicSide.left
      : GraphicSide.right;

    return graphicSide;
  }
}
