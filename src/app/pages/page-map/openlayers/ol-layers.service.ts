import { Injectable } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { BehaviorSubject, fromEvent, Subscription } from "rxjs";
import { View } from "ol";
import { Coordinate } from "ol/coordinate";
import { AnimationOptions } from "ol/View";
import { Fill, Stroke, Style } from "ol/style";
import { LayerKey, LayerProperties } from "./ol-model";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { environment } from "src/environments/environment";
import ImageLayer from "ol/layer/Image";
import ImageArcGISRest from "ol/source/ImageArcGISRest";
import BaseLayer from "ol/layer/Base";

@Injectable({
  providedIn: "root",
})
export class OLLayerService {
  cookieKey = "ol-layer";
  subscriptions: Subscription[] = [];
  layers$ = new BehaviorSubject<any[]>([]);

  constructor(private cookieService: CookieService) {}

  getLayers(houseFeature) {
    const layers: BaseLayer[] = [
      new VectorLayer({
        source: new VectorSource({
          features: [houseFeature],
        }),
        properties: new LayerProperties({
          key: LayerKey.House,
          name: "Passive house",
        }),
        zIndex: 100,
        style: [
          new Style({
            stroke: new Stroke({
              color: "rgba(0, 0, 0, 0)",
              width: 2,
            }),
            fill: new Fill({
              color: "rgba(30, 30, 30, 0.9)",
            }),
            zIndex: 1,
          }),
        ],
      }),
    ];

    if (!environment.production) {
      layers.push(
        ...[
          // new ImageLayer({
          //   source: new ImageArcGISRest({
          //     url: "https://maps.geoinfomittskane.se/arcgis/rest/services/GeoInfoMittskane/Fastighetsytor_Horby_Hoor/MapServer",
          //   }),
          // }),
          new ImageLayer({
            source: new ImageArcGISRest({
              url: "https://maps.geoinfomittskane.se/arcgis/rest/services/ExternData/Omradesskydd_extern/MapServer",
            }),
            properties: new LayerProperties({
              key: LayerKey.test,
              name: "Test thing",
            }),
            zIndex: 1,
            visible: false,
          }),
          // new ImageLayer({
          //   source: new ImageArcGISRest({
          //     url: "https://maps.geoinfomittskane.se/arcgis/rest/services/Planlagd_och_f%C3%B6reslagen_mark_f%C3%B6r_bostad__service_och_verksamhet_i_H%C3%B6rby_kommun_attach/MapServer",
          //   }),
          // }),
          new ImageLayer({
            source: new ImageArcGISRest({
              url: "https://maps.geoinfomittskane.se/arcgis/rest/services/Orto/LAS2019/MapServer",
              params: {},
            }),
            properties: new LayerProperties({
              key: LayerKey.dem,
              name: "DEM",
            }),
            zIndex: 1,
            // opacity: 0.8,
            visible: false,
          }),
          new ImageLayer({
            source: new ImageArcGISRest({
              url: "https://maps.geoinfomittskane.se/arcgis/rest/services/GeoInfoMittskane/Baskarta_tomtkarta_Hby/MapServer",
            }),
            properties: new LayerProperties({
              key: LayerKey.parcel,
            }),
            visible: false,
            zIndex: 1,
          }),
        ]
      );
    }

    this.layers$.next(layers);
    return layers;
  }
}
