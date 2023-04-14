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
import { map, of, tap } from "rxjs";
import VectorLayer from "ol/layer/Vector";

@Injectable({
  providedIn: "root",
})
export class MapService {
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
    private olContextService: OLContextService
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
        if (layer instanceof ImageLayer) {
          const url = layer.getSource().getUrl().trim("/") + "/identify";
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
                return response.results
                  .map(properties.maptipCallback)
                  .join("<br/>");
              })
            );
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
}
