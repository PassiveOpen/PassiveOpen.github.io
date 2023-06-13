import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import * as d3 from "d3";
import { take } from "rxjs";
import { AppService } from "../app.service";

@Injectable({
  providedIn: "root",
})
export class D3Service {
  constructor(public appService: AppService, private httpClient: HttpClient) {}

  loadSVG(url, selector: string, callback: Function): SvgLoader {
    const svgLoader = new SvgLoader(selector, callback);
    svgLoader.get(this.httpClient, url);
    return svgLoader;
  }
}

export class SvgLoader {
  selector: string;
  private callback: Function;

  constructor(selector: string, callback: Function) {
    this.selector = selector;
    this.callback = callback;
  }

  get(httpClient, url) {
    httpClient
      .get(url, { responseType: "text" })
      .pipe(take(1))
      .subscribe((x) => {
        d3.select(this.selector).html(
          x
            .replace(/height="\d+px"/gi, `height="0px"`)
            .replace(/width="\d+px"/gi, `width="0px"`)
        );
        this.update();
      });
  }

  update() {
    this.callback(this.selector);
  }
}
