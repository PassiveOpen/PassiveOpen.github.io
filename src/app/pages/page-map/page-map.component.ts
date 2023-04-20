import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewChild,
} from "@angular/core";
import { Collection, Feature, Map, MapBrowserEvent, View } from "ol";
import { House, xy } from "src/app/house/house.model";
import { HouseService } from "src/app/house/house.service";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import ImageArcGISRest from "ol/source/ImageArcGISRest.js";
import { Point, Polygon, LineString, MultiLineString } from "ol/geom";
import { Draw, Select, Translate } from "ol/interaction.js";
import {
  angleBetween,
  angleXY,
  centerBetweenPoints,
  rotateXY,
  round,
} from "src/app/shared/global-functions";
import { OLBaseMapService } from "./openlayers/ol-basemap.service";
import { OLMeasureService } from "./openlayers/ol-measure.service";
import { fromEvent, map, tap, Subscription, startWith, of } from "rxjs";
import { Circle, Fill, Icon, Stroke, Style, Text } from "ol/style";
import { OLViewService } from "./openlayers/ol-view.service";
import BaseLayer from "ol/layer/Base";
import { fromLonLat, toLonLat } from "ol/proj";
import { Wall, WallSide, WallType } from "src/app/model/specific/wall.model";
import { Floor, Graphic } from "src/app/components/enum.data";

import RotateFeatureInteraction from "ol-rotate-feature";
import { SelectEvent } from "ol/interaction/Select";
import { degToRad, radToDeg } from "three/src/math/MathUtils";
import { ColorService, Color } from "src/app/components/color/color.service";
import { TurfService } from "./openlayers/turf.service";
import { faMarker } from "@fortawesome/free-solid-svg-icons";
import ImageLayer from "ol/layer/Image";
import {
  animationFallInOut,
  animationSlideInOut,
} from "src/app/components/animations";
import { AppService } from "src/app/app.service";
import { OLLayerService } from "./openlayers/ol-layers.service";
import { LayerKey, LayerProperties } from "./openlayers/ol-model";
import { MapOverlayComponent } from "./components/map-overlay/map-overlay.component";
import { HttpClient } from "@angular/common/http";
import { Coordinate } from "ol/coordinate";
import { OLContextService } from "./openlayers/ol-context.service";
import { OLPrintService } from "./openlayers/ol-print.service";
import { OLDistanceService } from "./openlayers/ol-distance.service";
import { DataOLLayerService } from "./data/layer.data";
import { DataOLStyleService } from "./data/style.data";
import { TranslateEvent } from "ol/interaction/Translate";

@Component({
  selector: "app-page-map",
  templateUrl: "./page-map.component.html",
  styleUrls: ["./page-map.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [animationSlideInOut, animationFallInOut],
})
export class PageMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild("mapEl") mapEl: ElementRef;
  @ViewChild("overlay") overlay: MapOverlayComponent;

  house = this.houseService.house$.value;
  map: Map;
  layers: BaseLayer[];
  subscriptions: Subscription[] = [];

  center: Coordinate = [0, 0];
  rotation = 0;

  houseFeature = new Feature<LineString>({
    roofCenterShow: false,
    roofLines: undefined,
    footPrint: undefined,
    rotation: 0,
  });
  identifyActive = true;

  constructor(
    private zone: NgZone,
    private houseService: HouseService,
    private olBaseMapService: OLBaseMapService,
    private olMeasureService: OLMeasureService,
    private olViewService: OLViewService,
    private olLayerService: OLLayerService,
    private colorService: ColorService,
    private turfService: TurfService,
    private appService: AppService,
    private httpClient: HttpClient,
    private olPrintService: OLPrintService,
    private olDistanceService: OLDistanceService,
    private olContextService: OLContextService,

    private dataOLLayerService: DataOLLayerService,
    private dataOLStyleService: DataOLStyleService
  ) {}

  ngOnDestroy(): void {
    [this.olViewService, this.olContextService].forEach((x) => x.onDestroy());
    this.subscriptions.forEach((x) => x.unsubscribe());
  }

  ngAfterViewInit(): void {
    this.appService.scroll$.next({
      ...this.appService.scroll$.value,
      graphic: Graphic.map,
    });
    const { lat, lng, rotation } = this.houseService.house$.value.orientation;
    this.center = fromLonLat([lng, lat]);
    this.rotation = rotation;
    this.setCore();

    this.layers = [
      ...this.olBaseMapService.initBaseLayers(),
      ...this.olLayerService.initLayers(this.houseFeature),
    ];

    this.zone.runOutsideAngular(() => this.initMap());
  }

  initMap() {
    this.olViewService.init(this.center, 15);

    const printDpi = 300; // Print resolution in DPI
    const pixelRatio = printDpi / 96; // Pixel ratio for the print resolution

    this.map = new Map({
      view: this.olViewService.view,
      layers: this.layers,
      target: this.mapEl.nativeElement,
      overlays: [this.overlay.overlay],
      pixelRatio,
    });

    this.olContextService.init(this.map, this.overlay);
    this.olPrintService.init(this.map);
    this.olDistanceService.init(this.map, this.houseFeature);
    this.addInteractions();
    this.olMeasureService.init(this.map);
    this.olBaseMapService.map = this.map;
    (window as any).map = this.map;

    this.houseFeature.setStyle((f: any, r) =>
      this.dataOLStyleService.styleHouse(f, r, this.rotation, false)
    );
    // this.draw();
  }

  setCore() {
    const line = new LineString([
      this.center,
      angleXY(this.rotation, 10, this.center as xy) as Coordinate,
    ]);
    this.houseFeature.setGeometry(line);
    this.drawHouse();
  }

  drawHouse(silent: boolean = true) {
    const [polygon, roofLines] = this.houseService.getHousePolygon();
    this.houseFeature.setProperties(
      {
        roofCenter: new Point(this.center),
        roofLines: roofLines,
        footPrint: polygon,
      },
      silent
    );
  }
  updateHouse() {
    const [lng, lat] = toLonLat(this.center);
    const house = this.houseService.house$.value;
    house.orientation = {
      rotation: this.rotation,
      lat,
      lng,
    };
    this.houseService.house$.next(house);
  }

  addInteractions() {
    const getRotatePoint = () => {
      return angleXY(radToDeg(rotate.getAngle()) - 90, -30, this.center as xy);
    };
    const setPivot = () => {
      const coords = this.houseFeature.getGeometry().getCoordinates() as xy[];
      this.rotation = round(angleBetween(coords[1], coords[0], 1) + 180, 1);
      this.houseFeature.setProperties({ rotation: this.rotation });
    };

    const select = new Select({
      style: (f: any, r) =>
        this.dataOLStyleService.styleHouse(f, r, this.rotation, true),
      layers: [this.olLayerService.getLayer(LayerKey.House)],
    });
    const translate = new Translate({
      features: select.getFeatures(),
    });
    const rotate = new RotateFeatureInteraction({
      features: select.getFeatures(),
      style: (f, r) =>
        this.dataOLStyleService.createRotateStyle(f, r, this.rotation),
    });

    const setRotateIcon = () => {
      rotate.setAnchor(this.center);
      rotate.setAngle((0 * Math.PI) / 180);
      rotate.arrowFeature_.getGeometry().setCoordinates(getRotatePoint());
    };

    this.map.addInteraction(select);

    this.subscriptions.push(
      ...[
        fromEvent(this.houseFeature, "change").subscribe((e) => {
          this.updateHouse();
          this.drawHouse();
        }),
        fromEvent(translate, "translateend").subscribe((e) => {
          this.center = this.houseFeature.getGeometry().getCoordinates()[0];
          setRotateIcon();
          this.drawHouse();
        }),
        fromEvent(translate, "translating").subscribe((e: TranslateEvent) => {
          this.center = this.houseFeature.getGeometry().getCoordinates()[0];
          setRotateIcon();
        }),

        fromEvent(rotate, "rotatestart").subscribe((e) => {
          this.houseFeature.setProperties({
            roofCenterShow: true,
          });
        }),
        fromEvent(rotate, "rotating").subscribe((e) => {
          setPivot();
        }),
        fromEvent(rotate, "rotateend").subscribe((e) => {
          this.houseFeature.setProperties({
            roofCenterShow: false,
          });
          rotate.features_.pop();
          rotate.features_.push(this.houseFeature);
          setPivot();
          setRotateIcon();
          this.drawHouse();
        }),
        fromEvent(select, "select").subscribe((e: SelectEvent) => {
          const selected = e.selected[0];
          if (selected) {
            this.overlay.enabled = false;
            this.overlay.close();
            this.map.addInteraction(rotate);
            this.map.addInteraction(translate);
            setPivot();
            setRotateIcon();
            (rotate.arrowFeature_ as Feature).setStyle((f, r) =>
              this.dataOLStyleService.createRotateStyle(f, r, this.rotation)
            );
          } else {
            this.overlay.enabled = true;
            this.map.removeInteraction(rotate);
            this.map.removeInteraction(translate);
          }
          this.houseFeature.changed();
        }),
      ]
    );
  }
}
