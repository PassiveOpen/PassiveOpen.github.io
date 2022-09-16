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

  setStates(state: State, overrule?: boolean) {
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
  }

  getCookies() {
    let floor = this.cookieService.get('floor');
    if (floor === '') {
      floor = Floor.ground;
    }
    this.floor$.next(floor as Floor);
    let fullscreen: boolean | string = this.cookieService.get('fullscreen');
    if (fullscreen === '') {
      fullscreen = false;
    } else {
      fullscreen = fullscreen === 'true' ? true : false;
    }
    this.fullscreen$.next(fullscreen as boolean);
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

  setDarkMode(state: boolean = undefined) {
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
  }
}
