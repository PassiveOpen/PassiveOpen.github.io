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

  constructor(private cookieService: CookieService) {
    this.view = new View({
      center: this.center,
      zoom: 18,
    });
    this.centerAndZoom = this.getStore();
    this.subscriptions.push(
      fromEvent(this.view, "change").subscribe(() => this.setStore())
    );
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

  onDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  getStore(): CenterAndZoom {
    const cookie = this.cookieService.get(this.cookieKey);
    const centerAndZoom = JSON.parse(cookie);
    if (cookie === "")
      return {
        center: this.center,
        zoom: 15,
      };
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
