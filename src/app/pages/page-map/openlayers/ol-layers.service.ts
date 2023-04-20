import { Injectable } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { BehaviorSubject, fromEvent, Subject, Subscription } from "rxjs";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { environment } from "src/environments/environment";
import { Layer } from "ol/layer";
import { LayerKey, LayerProperties } from "./ol-model";
import { DataOLLayerService } from "../data/layer.data";
import { DataOLStyleService } from "../data/style.data";

@Injectable({
  providedIn: "root",
})
export class OLLayerService {
  cookieKey = "ol-layer";
  subscriptions: Subscription[] = [];
  layers$ = new BehaviorSubject<Layer[]>([]);
  update$ = new Subject();

  constructor(
    private cookieService: CookieService,
    private dataOLLayerService: DataOLLayerService,
    private dataOLStyleService: DataOLStyleService
  ) {
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
      if (config.opacity !== undefined) layer.setOpacity(config.opacity || 1);
      if (config.visible !== undefined) layer.setVisible(config.visible);
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

  getLayer<T>(key: LayerKey) {
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
      }),
    ];

    if (!environment.production) {
      layers.push(...this.dataOLLayerService.extraLayers);
    }

    layers = this.getStore(layers);
    this.layers$.next(layers);
    return layers;
  }
}
