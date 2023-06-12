import { Injectable } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { fromEvent, Subscription } from "rxjs";
import { View } from "ol";
import { Coordinate } from "ol/coordinate";
import { AnimationOptions } from "ol/View";

interface CenterAndZoom {
  center?: Coordinate;
  zoom?: number;
}

@Injectable({
  providedIn: "root",
})
export class OLViewService {
  cookieKey = "ol-view";
  subscriptions: Subscription[] = [];

  center = [0, 0];
  view: View;

  constructor(private cookieService: CookieService) {}

  init(center = [0, 0], zoom = 15) {
    this.center = center;
    this.view = new View({
      center: this.center,
      zoom,
    });
    this.centerAndZoom = this.getStore();
    this.subscriptions.push(
      fromEvent(this.view, "change").subscribe(() => this.setStore())
    );
  }
  onDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.view.dispose();
  }

  set centerAndZoom(centerAndZoom: CenterAndZoom) {
    if (centerAndZoom.center) {
      this.view.setCenter(centerAndZoom.center);
    }
    if (centerAndZoom.zoom) this.view.setZoom(centerAndZoom.zoom);
  }
  get centerAndZoom(): CenterAndZoom {
    return {
      center: this.view.getCenter(),
      zoom: this.view.getZoom(),
    };
  }

  getStore(): CenterAndZoom {
    const cookie = this.cookieService.get(this.cookieKey);
    if (cookie === "") {
      return {
        center: this.center,
        zoom: 15,
      };
    }
    const centerAndZoom = JSON.parse(cookie);
    return centerAndZoom;
  }
  setStore(): void {
    this.cookieService.set(this.cookieKey, JSON.stringify(this.centerAndZoom));
  }

  animate(centerAndZoom: CenterAndZoom, duration: number = 500) {
    const obj: AnimationOptions = { duration };
    if (centerAndZoom.zoom !== undefined) obj.zoom = centerAndZoom.zoom;
    if (centerAndZoom.center !== undefined) obj.center = centerAndZoom.center;
    this.view.animate(obj);
  }
}
