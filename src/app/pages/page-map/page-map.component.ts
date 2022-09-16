import { AfterViewInit, Component, ElementRef, HostListener, NgZone, ViewChild } from '@angular/core';
import { Feature, Map, View } from 'ol';
import Layer from 'ol/layer/Layer';
import Source from 'ol/source/Source';
import { AppService } from 'src/app/app.service';
import { House } from 'src/app/house/house.model';
import { HouseService } from 'src/app/house/house.service';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource, { VectorSourceEvent } from 'ol/source/Vector';
import { Geometry, Point } from 'ol/geom';


@Component({
  selector: 'app-page-map',
  templateUrl: './page-map.component.html',
  styleUrls: ['./page-map.component.scss'],
})
export class PageMapComponent implements AfterViewInit {

  @ViewChild('map') mapEl: ElementRef;
  map: Map;

  houseLayer: VectorLayer<VectorSource>;
  houseFeature = new Feature({
    geometry: new Point([1511855.49950191, 7539541.240669869])
  })

  constructor(
    private zone: NgZone,
    private appService: AppService,
    private houseService: HouseService,
  ) { }

  ngAfterViewInit (): void {
    this.zone.runOutsideAngular(() => this.initMap());
  }

  initMap () {
    this.houseLayer = new VectorLayer({
      source: new VectorSource({
        features: [
          this.houseFeature,
        ]
      }),
    })

    this.map = new Map({
      view: new View({
        center: [1511855.49950191, 7539541.240669869],
        zoom: 19,
      }),
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        this.houseLayer,
      ],
      target: this.mapEl.nativeElement,
    });

    (window as any).map = this.map


  }


}
