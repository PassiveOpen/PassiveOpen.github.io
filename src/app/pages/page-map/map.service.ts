import { Injectable } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { fromLonLat } from "ol/proj";
import { HouseService } from "src/app/house/house.service";
import { OLViewService } from "./openlayers/ol-view.service";

@Injectable({
  providedIn: "root",
})
export class MapService {
  constructor(
    private houseService: HouseService,
    private olViewService: OLViewService
  ) {}

  zoomToHouse() {
    const { lat, lng } = this.houseService.house$.value.orientation;
    const center = fromLonLat([lng, lat]);
    this.olViewService.animate({
      center,
      zoom: 17.5,
    });
  }
}
