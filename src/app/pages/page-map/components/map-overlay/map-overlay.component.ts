import {
  AfterViewInit,
  Component,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { MapBrowserEvent, Overlay } from "ol";
import { Coordinate } from "ol/coordinate";
import { fromLonLat, toLonLat } from "ol/proj";
import { BehaviorSubject, Observable, take, first } from "rxjs";
import { HouseService } from "src/app/house/house.service";
import { OLLayerService } from "../../openlayers/ol-layers.service";
import { LayerKey } from "../../openlayers/ol-model";
import { MapService } from "../../map.service";
import {
  MeasuringDrawType,
  OLMeasureService,
} from "../../openlayers/ol-measure.service";
import { OLPrintService } from "../../openlayers/ol-print.service";

@Component({
  selector: "app-map-overlay",
  templateUrl: "./map-overlay.component.html",
  styleUrls: ["./map-overlay.component.scss"],
})
export class MapOverlayComponent implements AfterViewInit {
  @ViewChild("popup", { static: true }) container: ElementRef;
  @ViewChild("content", { static: true }) content: ElementRef;
  @ViewChild("closer", { static: true }) closer: ElementRef;

  row1$ = new BehaviorSubject<any>(undefined);
  row2$ = new BehaviorSubject<any>(undefined);
  row3$ = new BehaviorSubject<any>(undefined);

  overlay: Overlay;
  enabled = true;
  special$ = this.olMeasureService.active || this.olPrintService.active$.value;

  MeasuringDrawType = MeasuringDrawType;

  basic = true;
  focusPrint = false;
  focusMeasure = false;

  constructor(
    public houseService: HouseService,
    private changeDetectorRef: ChangeDetectorRef,
    private mapService: MapService,
    public olMeasureService: OLMeasureService,
    public olPrintService: OLPrintService
  ) {}

  ngAfterViewInit(): void {
    this.overlay = new Overlay({
      element: this.container.nativeElement,
      positioning: "top-left",
      autoPan: {
        animation: {
          duration: 250,
        },
      },
    });
  }

  setPopup(coordinate: Coordinate) {
    this.overlay.setPosition(coordinate);
    this.mapService.identify(coordinate).forEach((obs, i) => {
      obs.pipe(take(1)).subscribe((x) => {
        if (i === 0) this.row1$.next(x);
        if (i === 1) this.row2$.next(x);
        if (i === 2) this.row3$.next(x);
        this.changeDetectorRef.detectChanges();
      });
    });
  }

  close() {
    this.row1$.next(undefined);
    this.row2$.next(undefined);
    this.row3$.next(undefined);
    this.overlay.setPosition(undefined);
    this.closer.nativeElement.blur();
    return false;
  }

  print() {
    if (this.olPrintService.active$.value) {
      this.olPrintService.onDestroy();
      this.basic = true;
      this.focusPrint = false;
    } else {
      this.focusPrint = true;
      this.basic = false;
      this.olPrintService.startPrint({
        center: fromLonLat(this.houseService.house$.value.getLonLat()),
      });
    }
  }
}
