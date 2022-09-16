import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  ViewChild,
} from '@angular/core';
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
import { Section, Tag } from 'src/app/components/enum.data';

@Component({
  selector: 'app-page-installation',
  templateUrl: './page-installation.component.html',
  styleUrls: ['./page-installation.component.scss'],
})
export class PageInstallationsComponent implements AfterViewInit {
  Tag = Tag;
  Section = Section;

  constructor(
    private zone: NgZone,
    private appService: AppService,
    private houseService: HouseService
  ) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => this.initMap());
  }

  initMap() {}
}
