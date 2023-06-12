import { Injectable } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { BehaviorSubject } from "rxjs";
import { Graphic } from "../components/enum.data";

type TransformStore = {
  [key in Graphic]?: D3Transform;
};

export type D3Transform = {
  k: number;
  x: number;
  y: number;
};
@Injectable({
  providedIn: "root",
})
export class SVGTransformService {
  svgTransform$ = new BehaviorSubject<TransformStore>({});

  constructor(private cookieService: CookieService) {
    this.onStartReadCookie();
  }

  onStartReadCookie() {
    let svgTransform = this.cookieService.get("svgTransform");
    if (svgTransform === "") {
      svgTransform = "{}";
    }
    this.svgTransform$.next(JSON.parse(svgTransform));
  }

  setTransformCookie(transformString: D3Transform, graphic: Graphic) {
    // console.log("setTransformCookie");
    this.svgTransform$.next({
      [graphic]: transformString,
    });

    this.cookieService.set(
      "svgTransform",
      JSON.stringify(this.svgTransform$.value)
    );
  }
}
