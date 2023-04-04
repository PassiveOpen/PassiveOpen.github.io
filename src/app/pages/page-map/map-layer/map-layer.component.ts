import { AfterViewInit, Component, Input } from "@angular/core";
import BaseLayer from "ol/layer/Base";
import {
  animationFallInOut,
  animationSlideInOut,
} from "src/app/components/animations";
import { HouseService } from "src/app/house/house.service";
import { OLLayerService } from "../openlayers/ol-layers.service";

@Component({
  selector: "app-map-layer",
  templateUrl: "./map-layer.component.html",
  styleUrls: ["./map-layer.component.scss"],
  animations: [animationSlideInOut, animationFallInOut],
})
export class MapLayerComponent implements AfterViewInit {
  layers$ = this.oLLayerService.layers$;

  constructor(
    public oLLayerService: OLLayerService,
    public houseService: HouseService
  ) {}

  ngAfterViewInit(): void {
    this.layers$.subscribe((x) => console.log(x.map((y) => y.getProperties())));
  }

  setState(layer: BaseLayer): void {
    layer.setVisible(!layer.getVisible());
  }
}
