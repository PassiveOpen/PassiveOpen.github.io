import { Injectable } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { BehaviorSubject, fromEvent, Subject, Subscription } from "rxjs";
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
import GeoJSON from "ol/format/GeoJSON.js";
import { extraLayers } from "../data/layer.data";
import { Layer } from "ol/layer";

@Injectable({
  providedIn: "root",
})
export class OLLayerService {
  cookieKey = "ol-layer";
  subscriptions: Subscription[] = [];
  layers$ = new BehaviorSubject<Layer[]>([]);
  update$ = new Subject();

  constructor(private cookieService: CookieService) {
    this.update$.subscribe(() => {
      this.setStore();
    });
  }
  update() {
    this.update$.next(undefined);
  }

  getStore(layers: Layer[]) {
    const cookie = this.cookieService.get(this.cookieKey);
    if (cookie === "") return;
    const cookieStr = JSON.parse(cookie);

    cookieStr.forEach((config) => {
      const layer = layers.find((x) => x.getProperties()["key"] === config.key);
      if (!layer) return;
      if (config.visible) layer.setVisible(config.visible);
      if (config.opacity) layer.setOpacity(config.opacity || 1);
    });
    return layers;
  }

  setStore(): void {
    const obj = this.layers$.value.map((layer) => {
      return {
        key: layer.getProperties()["key"],
        visible: layer.getVisible(),
        opacity: layer.getOpacity(),
      };
    });
    this.cookieService.set(this.cookieKey, JSON.stringify(obj));
  }

  getLayer(key: LayerKey) {
    const layers = this.layers$.getValue();
    return layers.find((x) => x.getProperties()["key"] === key);
  }
  setLayerProperty(key: LayerKey, property: string, value: any) {
    const layer = this.getLayer(key);
    layer.setProperties({ [property]: value });
  }

  initLayers(houseFeature) {
    let layers: Layer[] = [
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
      layers.push(...extraLayers);
    }

    layers = this.getStore(layers);
    this.layers$.next(layers);
    return layers;
  }
}
