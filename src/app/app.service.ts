import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  Floor,
  Graphic,
  GraphicSide,
  State,
  Section,
  Tag,
} from './components/enum.data';
interface Scroll {
  scroll;
  percentage;
  section: Section;
  graphicSide: GraphicSide;
  graphic: Graphic;
}
@Injectable({
  providedIn: 'root',
})
export class AppService {
  darkMode = false;
  title = 'Lindelund';
  update$ = new Subject<void>();

  tag$ = new BehaviorSubject(undefined);
  graphic$ = new BehaviorSubject(undefined);
  states$ = new BehaviorSubject<State[]>([]);
  popupActive$ = new BehaviorSubject(false);
  fullscreen$ = new BehaviorSubject(true);
  svgTransform$ = new BehaviorSubject(undefined);

  floor$ = new BehaviorSubject(Floor.ground);

  scroll$ = new BehaviorSubject<Scroll>({
    scroll: 0,
    percentage: 0,
    section: undefined,
    graphicSide: undefined,
    graphic: undefined,
  });

  constructor(private cookieService: CookieService) {
    this.getCookies();
  }

  setStates(state: State, overrule?: boolean, checkCoockie?: boolean) {
    const old = this.states$.value;
    let arr;
    const exists = () => old.includes(state);
    const add = () => {
      if (exists()) {
        arr = old;
      } else {
        arr = [...old, state];
      }
    };
    const remove = () => {
      arr = old.filter((x) => x !== state);
    };

    if (checkCoockie) {
      const allStates = this.cookieService.get('states');
      if (allStates.includes(state)) {
        return;
        console.log(allStates, state);
      }
    }
    if (overrule === true) {
      add();
    } else if (overrule === false) {
      remove();
    } else {
      if (exists()) {
        remove();
      } else {
        add();
      }
    }
    this.states$.next(arr);

    this.cookieService.set('states', arr);
  }

  setTransformCookie(e, graphic) {
    this.svgTransform$.next({
      [graphic]: e,
    });
    this.cookieService.set(
      'svgTransform',
      JSON.stringify(this.svgTransform$.value)
    );
  }

  getCookies() {
    // ======= floor =======
    let floor = this.cookieService.get('floor');
    if (floor === '') {
      floor = Floor.ground;
    }
    this.floor$.next(floor as Floor);

    // ======= fullscreen =======
    let fullscreen: boolean | string = this.cookieService.get('fullscreen');
    if (fullscreen === '') {
      fullscreen = false;
    } else {
      fullscreen = fullscreen === 'true' ? true : false;
    }
    this.fullscreen$.next(fullscreen as boolean);

    // ======= zoomLevel =======
    let svgTransform = this.cookieService.get('svgTransform');
    if (svgTransform === '' || fullscreen === false) {
      svgTransform = '{}';
    }
    this.svgTransform$.next(JSON.parse(svgTransform));

    // ======= darkmode =======
    let darkMode: boolean | string = this.cookieService.get('darkMode');
    if (darkMode === '') {
      this.setDarkMode(
        window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    } else {
      this.setDarkMode(darkMode === 'true');
    }

    // ======= States =======
    let statesString: string = this.cookieService.get('states');
    const states = statesString.split(',');
    this.states$.next(states as State[]);
  }

  setFloor(floor: Floor = undefined) {
    let next;
    if (floor !== undefined) {
      next = floor;
    } else {
      if (this.floor$.value === Floor.ground) {
        next = Floor.top;
      }
      if (this.floor$.value === Floor.top) {
        next = Floor.ground;
      }
    }
    this.floor$.next(next);
    this.cookieService.set('floor', next);
    this.update$.next();
  }

  setTag(tag: Tag) {
    this.tag$.next(tag);
    this.update$.next();
  }

  setDarkMode(state: boolean = undefined, save = false) {
    document.body.classList.remove('light');
    document.body.classList.remove('dark');
    if (state !== undefined) {
      this.darkMode = state;
    } else {
      this.darkMode = !this.darkMode;
    }
    if (this.darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.add('light');
    }
    if (save) this.cookieService.set('darkMode', `${this.darkMode}`, 0.1);
  }
}
