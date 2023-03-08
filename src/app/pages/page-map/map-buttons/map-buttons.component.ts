import { AfterViewInit, Component, Input } from "@angular/core";
import {
  animationFallInOut,
  animationSlideInOut,
} from "src/app/components/animations";
import { OLBaseMapService } from "../openlayers/ol-basemap.service";
import { OLMeasureService } from "../openlayers/ol-measure.service";
import { OLViewService } from "../openlayers/ol-view.service";
import { HouseService } from "src/app/house/house.service";
import { fromLonLat, toLonLat } from "ol/proj";

@Component({
  selector: "app-map-buttons",
  templateUrl: "./map-buttons.component.html",
  styleUrls: ["./map-buttons.component.scss"],
  animations: [animationSlideInOut, animationFallInOut],
})
export class MapButtonsComponent implements AfterViewInit {
  basemap$ = this.olBaseMapService.basemap$.pipe();

  constructor(
    public olViewService: OLViewService,
    public olBaseMapService: OLBaseMapService,
    public olMeasureService: OLMeasureService,
    public houseService: HouseService
  ) {}

  ngAfterViewInit(): void {}

  zoomToHouse() {
    const { lat, lng } = this.houseService.house$.value.orientation;
    const center = fromLonLat([lng, lat]);
    this.olViewService.animate({
      center,
      zoom: 16,
    });
  }
}
