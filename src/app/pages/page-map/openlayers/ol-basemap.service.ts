import { Injectable } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { Map } from "ol";
import ImageLayer from "ol/layer/Image";
import TileLayer from "ol/layer/Tile";
import ImageArcGISRest from "ol/source/ImageArcGISRest";
import OSM from "ol/source/OSM";
import TileSource from "ol/source/Tile";
import XYZ from "ol/source/XYZ";
import { BehaviorSubject } from "rxjs";
import { environment } from "src/environments/environment";
import { BasemapKey, LayerProperties } from "./ol-model";
import { baseLayers, extraBaseLayers } from "../data/baselayer.data";

@Injectable({
  providedIn: "root",
})
export class OLBaseMapService {
  cookieKey = "ol-basemap";
  map: Map;
  basemap$ = new BehaviorSubject(BasemapKey.OSM);

  constructor(private cookieService: CookieService) {
    this.basemap$.subscribe(() => this.onChangeBasemap());
  }

  setBasemap(basemap: BasemapKey) {
    this.basemap$.next(basemap);
  }

  nextBasemap() {
    const arr = Object.values(BasemapKey);
    const index = arr.indexOf(this.basemap$.value);
    this.basemap$.next(arr[(index + 1) % arr.length]);
  }

  initBaseLayers() {
    this.getStore();
    const layers: (TileLayer<any> | ImageLayer<any>)[] = baseLayers;
    if (!environment.production) {
      layers.push(...extraBaseLayers);
    }
    return layers;
  }

  getBaselayers() {
    if (!this.map) return [];
    return this.map
      .getLayers()
      .getArray()
      .filter((x) => x.getProperties()["basemap"] === true);
  }

  private onChangeBasemap() {
    this.getBaselayers().forEach((x) =>
      x.setVisible(x.getProperties()["key"] === this.basemap$.value)
    );
    this.setStore();
  }

  private getStore(): void {
    const cookie = this.cookieService.get(this.cookieKey);
    if (cookie === "") return;
    const cookieStr = JSON.parse(cookie);
    if (!(cookieStr in BasemapKey)) return;
    this.basemap$.next(cookieStr);
  }

  private setStore(): void {
    this.cookieService.set(this.cookieKey, JSON.stringify(this.basemap$.value));
  }
}
