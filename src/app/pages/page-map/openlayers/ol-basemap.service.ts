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

@Injectable({
  providedIn: "root",
})
export class OLBaseMapService {
  cookieKey = "ol-basemap";
  map: Map;
  basemap$ = new BehaviorSubject(BasemapKey.OSM);

  constructor(private cookieService: CookieService) {}

  getStore(): void {
    const cookie = this.cookieService.get(this.cookieKey);
    if (cookie === "") return;
    const cookieStr = JSON.parse(cookie);
    if (!(cookieStr in BasemapKey)) return;
    this.basemap$.next(cookieStr);
  }
  setStore(): void {
    this.cookieService.set(this.cookieKey, JSON.stringify(this.basemap$.value));
  }

  nextBasemap() {
    const arr = Object.values(BasemapKey);
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

  getBaseLayers() {
    this.getStore();
    const layers: (TileLayer<any> | ImageLayer<any>)[] = [
      new TileLayer({
        visible: this.basemap$.value === BasemapKey.OSM,
        properties: new LayerProperties({
          basemap: true,
          key: BasemapKey.OSM,
        }),
        source: new OSM(),
      }),

      new TileLayer({
        visible: this.basemap$.value === BasemapKey.OSMSatellite,
        properties: new LayerProperties({
          basemap: true,
          key: BasemapKey.OSMSatellite,
        }),
        source: new XYZ({
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          maxZoom: 19,
        }),
      }),
      new TileLayer({
        visible: this.basemap$.value === BasemapKey.Google,
        properties: new LayerProperties({
          basemap: true,
          key: BasemapKey.Google,
        }),
        source: new XYZ({
          url: "http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
        }),
      }),
      new TileLayer({
        visible: this.basemap$.value === BasemapKey.GoogleSatellite,
        properties: new LayerProperties({
          basemap: true,
          key: BasemapKey.GoogleSatellite,
        }),
        source: new XYZ({
          url: "http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}",
        }),
      }),
    ];

    if (!environment.production) {
      layers.push(
        ...[
          new ImageLayer({
            visible: false,
            properties: new LayerProperties({
              basemap: true,
              key: BasemapKey.Horby1960,
            }),
            source: new ImageArcGISRest({
              url: "https://maps.geoinfomittskane.se/arcgis/rest/services/sde_orto_DBO_Ortofoto_Hby_1960/ImageServer",
            }),
          }),
          new ImageLayer({
            visible: false,
            properties: new LayerProperties({
              basemap: true,
              key: BasemapKey.Horby1975,
            }),
            source: new ImageArcGISRest({
              url: "https://maps.geoinfomittskane.se/arcgis/rest/services/sde_orto_DBO_Ortofoto_Hby_1975/ImageServer",
            }),
          }),
        ]
      );
    }
    return layers;
  }
}
