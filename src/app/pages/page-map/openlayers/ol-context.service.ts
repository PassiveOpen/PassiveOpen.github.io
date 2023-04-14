import { Injectable } from "@angular/core";
import { Map, MapBrowserEvent } from "ol";
import { Subscription, fromEvent } from "rxjs";
import { MapOverlayComponent } from "../components/map-overlay/map-overlay.component";

@Injectable({
  providedIn: "root",
})
export class OLContextService {
  map: Map;
  subscriptions: Subscription[] = [];
  overlay: MapOverlayComponent;

  onDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  init(map: Map, overlay: MapOverlayComponent) {
    this.map = map;
    this.overlay = overlay;

    this.subscriptions.push(
      ...[
        fromEvent(this.map.getViewport(), "contextmenu").subscribe(
          (e: MouseEvent) => {
            this.openOverlay(e as any);
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }
        ),
      ]
    );
  }

  openOverlay(e: MouseEvent) {
    const coordinate = this.map.getEventCoordinate(e);
    this.overlay.setPopup(coordinate);

    this.subscriptions.push(
      ...[
        fromEvent(this.map.getViewport(), "pointerdrag").subscribe(
          (e: MouseEvent) => {
            console.log("pointerdrag", e);
          }
        ),
      ]
    );
  }
}
