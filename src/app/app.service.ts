import { Injectable } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { CookieService } from "ngx-cookie-service";
import { BehaviorSubject, filter, map, startWith, Subject, tap } from "rxjs";
import {
  Floor,
  Graphic,
  GraphicSide,
  State,
  Section,
  Tag,
  StatesExtended,
} from "./components/enum.data";

interface Scroll {
  scroll;
  percentage;
  section: Section;
  graphicSide: GraphicSide;
  graphic: Graphic;
}

export type StateObj = { [key in StatesExtended]?: boolean };

@Injectable({
  providedIn: "root",
})
export class AppService {
  darkMode = false;
  title = "Lindelund";
  update$ = new Subject<void>();

  tag$ = new BehaviorSubject(undefined);
  graphic$ = new BehaviorSubject(undefined);
  states$ = new BehaviorSubject<StateObj>({});
  popupActive$ = new BehaviorSubject(false);
  fullscreen$ = new BehaviorSubject(true);
  svgTransform$ = new BehaviorSubject(undefined);
  page$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(this.router),
    map((event: Router | NavigationEnd) => {
      const routes = event.url.toLowerCase().split("/");
      return routes[1];
    })
  );

  floor$ = new BehaviorSubject(Floor.ground);
  discord = "https://discord.gg/hrjfzY3yTp";
  github = "https://github.com/PassiveOpen/PassiveOpen.github.io";
  scroll$ = new BehaviorSubject<Scroll>({
    scroll: 0,
    percentage: 0,
    section: undefined,
    graphicSide: undefined,
    graphic: undefined,
  });
  silentStates: StateObj;
  constructor(private cookieService: CookieService, private router: Router) {
    this.getCookies();
  }

  setStatesSilent(states: StatesExtended[], o?: boolean, c?: boolean) {
    states.flatMap((state) => this.setState(state, o, c, false));
  }
  hardSetStates(stateObj: StateObj) {
    const oldStates = this.states$.value;
    Object.entries(stateObj).forEach(([k, v]) => {
      oldStates[k] = v;
    });
    this.commitState(oldStates);
  }
  setState(
    key: StatesExtended,
    overrule?: boolean,
    checkCookie?: boolean,
    commit = true
  ) {
    const states = this.states$.value;

    if (checkCookie) {
      states[key] = Boolean(this.cookieService.get("states"));
    }
    if (overrule) {
      states[key] = overrule;
    } else {
      if (states[key] !== undefined) {
        states[key] = !states[key];
      } else {
        states[key] = true;
      }
    }

    if (commit) {
      this.commitState(states);
    } else {
      this.silentStates = states;
    }
  }

  commitState(newState: StateObj) {
    this.states$.next(newState);
    this.cookieService.set("states", JSON.stringify(newState));
  }

  setTransformCookie(e, graphic) {
    this.svgTransform$.next({
      [graphic]: e,
    });
    this.cookieService.set(
      "svgTransform",
      JSON.stringify(this.svgTransform$.value)
    );
  }

  getCookies() {
    // ======= floor =======
    let floor = this.cookieService.get("floor");
    if (floor === "") {
      floor = Floor.ground;
    }
    this.floor$.next(floor as Floor);

    // ======= fullscreen =======
    let fullscreen: boolean | string = this.cookieService.get("fullscreen");
    if (fullscreen === "") {
      fullscreen = false;
    } else {
      fullscreen = fullscreen === "true" ? true : false;
    }
    this.fullscreen$.next(fullscreen as boolean);

    // ======= zoomLevel =======
    let svgTransform = this.cookieService.get("svgTransform");
    if (svgTransform === "" || fullscreen === false) {
      svgTransform = "{}";
    }
    this.svgTransform$.next(JSON.parse(svgTransform));

    // ======= darkmode =======
    let darkMode: boolean | string = this.cookieService.get("darkMode");
    if (darkMode === "") {
      this.setDarkMode(
        window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    } else {
      this.setDarkMode(darkMode === "true");
    }

    // ======= States =======
    let statesString: string = this.cookieService.get("states");
    if (statesString === "") {
      statesString = "{}";
    }
    this.states$.next(JSON.parse(statesString));
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
    this.cookieService.set("floor", next);
    this.update$.next();
  }

  setTag(tag: Tag) {
    this.tag$.next(tag);
    this.update$.next();
  }

  setDarkMode(state: boolean = undefined, save = false) {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");
    if (state !== undefined) {
      this.darkMode = state;
    } else {
      this.darkMode = !this.darkMode;
    }
    if (this.darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.add("light");
    }
    if (save) this.cookieService.set("darkMode", `${this.darkMode}`, 0.1);
  }
}
