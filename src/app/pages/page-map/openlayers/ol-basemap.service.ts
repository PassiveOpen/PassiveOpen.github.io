import { Injectable } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { Map } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import TileSource from "ol/source/Tile";
import XYZ from "ol/source/XYZ";
import { BehaviorSubject } from "rxjs";

export enum Basemap {
  OSM = "OSM",
  Google = "Google",
  OSMSatellite = "OSMSatellite",
  GoogleSatellite = "GoogleSatellite",
}

interface LayerProperties {
  basemap: boolean;
  key: Basemap;
}

@Injectable({
  providedIn: "root",
})
export class OLBaseMapService {
  cookieKey = "ol-basemap";
  map: Map;
  basemap$ = new BehaviorSubject(Basemap.OSM);

  constructor(private cookieService: CookieService) {}

  getStore(): void {
    const cookie = this.cookieService.get(this.cookieKey);
    if (cookie === "") return;
    const cookieStr = JSON.parse(cookie);
    if (!(cookieStr in Basemap)) return;
    this.basemap$.next(cookieStr);
  }
  setStore(): void {
    this.cookieService.set(this.cookieKey, JSON.stringify(this.basemap$.value));
  }

  getBaseLayers(): TileLayer<TileSource>[] {
    this.getStore();
    return [
      new TileLayer({
        visible: this.basemap$.value === Basemap.OSM,
        properties: {
          basemap: true,
          key: Basemap.OSM,
        },
        source: new OSM(),
      }),

      new TileLayer({
        visible: this.basemap$.value === Basemap.OSMSatellite,
        properties: {
          basemap: true,
          key: Basemap.OSMSatellite,
        },
        source: new XYZ({
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          maxZoom: 19,
        }),
      }),
      new TileLayer({
        visible: this.basemap$.value === Basemap.Google,
        properties: {
          basemap: true,
          key: Basemap.Google,
        },
        source: new XYZ({
          url: "http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
        }),
      }),
      new TileLayer({
        visible: this.basemap$.value === Basemap.GoogleSatellite,
        properties: {
          basemap: true,
          key: Basemap.GoogleSatellite,
        },
        source: new XYZ({
          url: "http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}",
        }),
      }),
    ];
  }

  nextBasemap() {
    const arr = Object.values(Basemap);
    const index = arr.indexOf(this.basemap$.value);
    this.basemap$.next(arr[(index + 1) % arr.length]);

    this.map
      .getLayers()
      .getArray()
      .filter((x) => x.getProperties()["basemap"] === true)
      .forEach((x) =>
        x.setVisible(x.getProperties()["key"] === this.basemap$.value)
      );
    this.setStore();
  }
}
