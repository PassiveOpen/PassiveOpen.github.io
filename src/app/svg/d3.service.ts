import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { take } from 'rxjs';
import { AppService } from '../app.service';
import { HouseService } from '../house/house.service';
import * as d3 from 'd3';

@Injectable({
  providedIn: 'root',
})
export class D3Service {
  constructor(
    public houseService: HouseService,
    public appService: AppService,
    private httpClient: HttpClient
  ) {}

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
      .get(url, { responseType: 'text' })
      .pipe(take(1))
      .subscribe((x) => {
        d3.select(this.selector).html(x);
      });
  }
  update() {
    this.callback(this.selector);
  }
}
