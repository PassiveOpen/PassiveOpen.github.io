import { Injectable } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { fromLonLat } from "ol/proj";
import { HouseService } from "src/app/house/house.service";
import { OLViewService } from "./openlayers/ol-view.service";
import { Coordinate } from "ol/coordinate";
import { OLBaseMapService } from "./openlayers/ol-basemap.service";
import { OLMeasureService } from "./openlayers/ol-measure.service";
import { OLLayerService } from "./openlayers/ol-layers.service";
import { ColorService } from "src/app/components/color/color.service";
import { TurfService } from "./openlayers/turf.service";
import { AppService } from "src/app/app.service";
import { HttpClient } from "@angular/common/http";
import { OLContextService } from "./openlayers/ol-context.service";
import ImageLayer from "ol/layer/Image";
import { LayerProperties } from "./openlayers/ol-model";
import { Subject, map, of, tap } from "rxjs";
import VectorLayer from "ol/layer/Vector";
import ImageArcGISRest from "ol/source/ImageArcGISRest";
import GeoTIFF from "ol/source/GeoTIFF.js";
import { xy } from "src/app/house/house.model";
import { round } from "src/app/shared/global-functions";

@Injectable({
  providedIn: "root",
})
export class MapService {
  update$ = new Subject();

  elevations = [];

  constructor(
    private houseService: HouseService,
    private olBaseMapService: OLBaseMapService,
    private olMeasureService: OLMeasureService,
    private olViewService: OLViewService,
    private olLayerService: OLLayerService,
    private colorService: ColorService,
    private turfService: TurfService,
    private appService: AppService,
    private httpClient: HttpClient,
    private cookieService: CookieService
  ) {}

  zoomToHouse() {
    const { lat, lng } = this.houseService.house$.value.orientation;
    const center = fromLonLat([lng, lat]);
    this.olViewService.animate({
      center,
      zoom: 17.5,
    });
  }

  identify(coordinate: Coordinate) {
    const observable = this.olLayerService.layers$.value
      .map((layer) => {
        const properties = layer.getProperties() as LayerProperties;
        if (properties.maptip !== true) return;
        const source = layer.getSource();

        if (source instanceof ImageArcGISRest) {
          this.esriMapIdentity$(source.getUrl(), coordinate).pipe(
            map(properties.maptipCallback)
          );
        }
        if (source instanceof GeoTIFF) {
          const pixel =
            this.olBaseMapService.map.getPixelFromCoordinate(coordinate);
          const data = layer.getData(pixel);
          console.log(coordinate, data);

          return of(properties.maptipCallback(data));
        }

        if (layer instanceof VectorLayer) {
          const features = layer
            .getSource()
            .getFeaturesAtCoordinate(coordinate);
          return of(features.map(properties.maptipCallback).join("<br/>"));
        }
      })
      .filter((x) => x);
    return observable;
  }

  esriMapIdentity$(baseUrl: string, coordinate: Coordinate) {
    const url = `${baseUrl}/identify`;
    const params = {
      geometry: `${coordinate[0]}, ${coordinate[1]}`,
      geometryType: "esriGeometryPoint",
      sr: 3857,
      layers: "all",
      tolerance: "2",
      mapExtent: `${coordinate[0]}, ${coordinate[1]},${coordinate[0]}, ${coordinate[1]}`,
      imageDisplay: "2,2,2",
      returnGeometry: false,
      f: "pjson",
    };

    return this.httpClient
      .get(url, {
        params,
      })
      .pipe(
        tap((response: any) => {
          if (response.error) {
            console.error(`ESRI error`, response.error);
            throw new Error(response.error.message);
          }
        }),
        map((response: any) => {
          return response.results;
        })
      );
  }

  getStoreIdenify() {
    const cookie = this.cookieService.get("indenify");
    if (cookie === "") {
      return;
    }
    const obj = JSON.parse(cookie);
    this.elevations = obj;
  }
  setStore(): void {
    const l = this.elevations.length;
    this.elevations = this.elevations.slice(l - 40, l);
    this.cookieService.set("indenify", JSON.stringify(this.elevations));
  }

  getElevationPoints() {
    const { localAndGlobal } = this.houseService.getFootPrintPolygon();

    this.getStoreIdenify();
    const url =
      "https://maps.geoinfomittskane.se/arcgis/rest/services/Orto/LAS2019/MapServer";

    localAndGlobal.map((x) => {
      const [gobal, local] = x;

      const localKey = local.map((x) => round(x, 2)).join("_");
      const globalKey = gobal.map((x) => round(x, 2)).join("_");

      if (!this.elevations.find((x) => x.globalKey === globalKey)) {
        this.esriMapIdentity$(url, gobal)
          // of([123])
          .subscribe((features) => {
            this.elevations.push({
              globalKey: globalKey,
              localKey: localKey,
              xy: local,
              value: Number(features[0].attributes["Pixel Value"]),
            });
            this.setStore();
          });
      }
    });
    return this.elevations;
  }
}
