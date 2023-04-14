import { AfterViewInit, Component, Input } from "@angular/core";
import BaseLayer from "ol/layer/Base";
import {
  animationFallInOut,
  animationSlideInOut,
} from "src/app/components/animations";
import { HouseService } from "src/app/house/house.service";
import { OLLayerService } from "../../openlayers/ol-layers.service";

@Component({
  selector: "app-map-toc-layer",
  templateUrl: "./map-toc-layer.component.html",
  styleUrls: ["./map-toc-layer.component.scss"],
  animations: [animationSlideInOut, animationFallInOut],
})
export class MapLayerComponent implements AfterViewInit {
  layers$ = this.oLLayerService.layers$;

  constructor(
    public oLLayerService: OLLayerService,
    public houseService: HouseService
  ) {}

  ngAfterViewInit(): void {}

  setVisible(layer: BaseLayer): void {
    layer.setVisible(!layer.getVisible());
    this.oLLayerService.update();
  }

  setOpacity(layer: BaseLayer, value: any): void {
    layer.setOpacity(value);
    this.oLLayerService.update();
  }
}
