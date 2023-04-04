import {
  AfterViewInit,
  Component,
  Input,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { MapBrowserEvent, Overlay } from "ol";
import { Coordinate } from "ol/coordinate";
import { toLonLat } from "ol/proj";
import { BehaviorSubject, Observable } from "rxjs";
import { HouseService } from "src/app/house/house.service";
import { OLLayerService } from "../openlayers/ol-layers.service";
import { LayerKey } from "../openlayers/ol-model";

@Component({
  selector: "app-map-overlay",
  templateUrl: "./map-overlay.component.html",
  styleUrls: ["./map-overlay.component.scss"],
})
export class MapOverlayComponent implements AfterViewInit {
  @ViewChild("popup", { static: true }) container: ElementRef;
  @ViewChild("content", { static: true }) content: ElementRef;
  @ViewChild("closer", { static: true }) closer: ElementRef;

  features$ = new BehaviorSubject<any[]>([]);

  overlay: Overlay;
  enabled = true;

  constructor(public houseService: HouseService) {}

  ngAfterViewInit(): void {
    this.overlay = new Overlay({
      element: this.container.nativeElement,
      autoPan: {
        animation: {
          duration: 250,
        },
      },
    });
  }

  setPopup(coordinate: Coordinate, callback$: () => Observable<any>) {
    callback$().subscribe((html) => {
      if (html === "" || html === undefined || this.enabled === false) return;
      this.content.nativeElement.innerHTML = html;
      this.overlay.setPosition(coordinate);
    });
  }

  close() {
    this.overlay.setPosition(undefined);
    this.closer.nativeElement.blur();
    return false;
  }
}
