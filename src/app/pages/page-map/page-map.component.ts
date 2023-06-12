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
import { Wall, WallSide, WallType } from "src/app/house-parts/wall.model";
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
import { MapService } from "./map.service";

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

  houseFeature = new Feature<LineString>({
    roofCenterShow: false,
    roofLines: undefined,
    rotation: 0,
    center: 0,
  });
  garageFeature = new Feature<LineString>({
    roofCenterShow: false,
    rotation: 0,
    center: 0,
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
    private mapService: MapService,
    private dataOLLayerService: DataOLLayerService,
    private dataOLStyleService: DataOLStyleService
  ) {}

  ngOnDestroy(): void {
    [this.olViewService, this.olContextService, this.olLayerService].forEach(
      (x) => x.onDestroy()
    );
    this.subscriptions.forEach((x) => x.unsubscribe());
  }

  ngAfterViewInit(): void {
    this.appService.scroll$.next({
      ...this.appService.scroll$.value,
      graphic: Graphic.map,
    });

    const house = this.houseService.house$.value;
    const { lat, lng, rotation } = house.orientation;
    const garage = this.houseService.house$.value.garage;
    let { lat: latG, lng: lngG, rotation: rotationG } = garage.orientation;

    this.houseFeature.setId("house");
    this.houseFeature.setProperties({
      center: fromLonLat([lng, lat]),
      rotation,
    });

    console.log(house);

    this.garageFeature.setId("garage");
    this.garageFeature.setProperties({
      center: fromLonLat([lngG, latG]),
      rotation: rotationG,
    });

    this.layers = [
      ...this.olBaseMapService.initBaseLayers(),
      ...this.olLayerService.initLayers(this.houseFeature, this.garageFeature),
    ];

    this.zone.runOutsideAngular(() => this.initMap());
  }

  initMap() {
    this.olViewService.init(this.houseFeature.getProperties()["center"], 15);

    const printDpi = 300; // Print resolution in DPI
    const pixelRatio = printDpi / 96; // Pixel ratio for the print resolution

    this.map = new Map({
      view: this.olViewService.view,
      layers: this.layers,
      target: this.mapEl.nativeElement,
      overlays: [this.overlay.overlay],
      pixelRatio,
    });
    (window as any).map = this.map;
    this.setCore();

    this.olContextService.init(this.map, this.overlay);
    this.olPrintService.init(this.map);
    // this.olDistanceService.init(this.map, this.houseFeature);
    this.addInteractions();
    this.olMeasureService.init(this.map);
    this.olBaseMapService.map = this.map;

    [this.houseFeature, this.garageFeature].forEach((x) =>
      x.setStyle((f: any, r) => this.dataOLStyleService.styleHouse(f, r, false))
    );
  }

  setCore() {
    [this.houseFeature, this.garageFeature].forEach((feature) => {
      const geom = new LineString([
        feature.getProperties()["center"],
        angleXY(
          feature.getProperties()["rotation"],
          10,
          feature.getProperties()["center"] as xy
        ) as Coordinate,
      ]);
      feature.setGeometry(geom);
    });
  }

  drawGarage(silent: boolean = true) {
    const { polygon } = this.houseService.getGaragePolygon();
    this.garageFeature.setProperties(
      {
        roofCenter: new Point(this.garageFeature.getProperties()["center"]),
        footPrint: polygon,
      },
      silent
    );
  }

  drawHouse(silent: boolean = true) {
    const { polygon, roofLines } = this.houseService.getFootPrintPolygon();
    this.houseFeature.setProperties(
      {
        roofCenter: new Point(this.houseFeature.getProperties()["center"]),
        roofLines: roofLines,
        footPrint: polygon,
      },
      silent
    );
    this.mapService.getElevationPoints();
  }
  updateHouse() {
    const [lng, lat] = toLonLat(this.houseFeature.getProperties()["center"]);
    const house = this.houseService.house$.value;
    house.orientation = {
      rotation: this.houseFeature.getProperties()["rotation"],
      lat,
      lng,
    };
    const [lngG, latG] = toLonLat(this.garageFeature.getProperties()["center"]);
    house.garage.orientation = {
      rotation: this.garageFeature.getProperties()["rotation"],
      lat: latG,
      lng: lngG,
    };
    this.houseService.house$.next(house);
  }

  addInteractions() {
    const getRotatePoint = (feature) => {
      return angleXY(
        radToDeg(rotate.getAngle()) - 90,
        -30,
        feature.getProperties()["center"] as xy
      );
    };
    const setPivot = (feature) => {
      const coords = feature.getGeometry().getCoordinates() as xy[];
      const rotation = round(angleBetween(coords[1], coords[0], 1) + 180, 1);
      feature.setProperties({ rotation: rotation });
    };

    const select = new Select({
      style: (f: any, r) => this.dataOLStyleService.styleHouse(f, r, true),
      layers: [this.olLayerService.getLayer(LayerKey.House)],
    });
    const translate = new Translate({
      features: select.getFeatures(),
    });
    const rotate = new RotateFeatureInteraction({
      features: select.getFeatures(),
      style: (f, r) => this.dataOLStyleService.createRotateStyle(f, r),
    });

    const setRotateIcon = (feature) => {
      rotate.setAnchor(feature.getProperties()["center"]);
      rotate.setAngle((0 * Math.PI) / 180);
      rotate.arrowFeature_
        .getGeometry()
        .setCoordinates(getRotatePoint(feature));
    };

    this.map.addInteraction(select);

    this.subscriptions.push(
      ...[
        ...[this.houseFeature, this.garageFeature].map((feature) =>
          fromEvent(feature, "change").subscribe((e) => {
            this.updateHouse();
            this.drawHouse();
            this.drawGarage();
          })
        ),
        fromEvent(translate, "translateend").subscribe((e) => {
          const feature = select.getFeatures().item(0) as Feature<LineString>;
          feature.setProperties({
            center: feature.getGeometry().getCoordinates()[0],
          });
          setRotateIcon(feature);
          this.drawHouse();
          this.drawGarage();
        }),
        fromEvent(translate, "translating").subscribe((e: TranslateEvent) => {
          const feature = select.getFeatures().item(0) as Feature<LineString>;
          feature.setProperties({
            center: feature.getGeometry().getCoordinates()[0],
          });
          setRotateIcon(feature);
        }),

        fromEvent(rotate, "rotatestart").subscribe((e) => {
          const feature = select.getFeatures().item(0) as Feature<LineString>;
          feature.setProperties({
            roofCenterShow: true,
          });
        }),
        fromEvent(rotate, "rotating").subscribe((e) => {
          const feature = select.getFeatures().item(0) as Feature<LineString>;
          setPivot(feature);
        }),
        fromEvent(rotate, "rotateend").subscribe((e) => {
          const feature = select.getFeatures().item(0) as Feature<LineString>;
          feature.setProperties({
            roofCenterShow: false,
          });
          rotate.features_.pop();
          rotate.features_.push(feature);
          setPivot(feature);
          setRotateIcon(feature);
          this.drawHouse();
          this.drawGarage();
        }),
        fromEvent(select, "select").subscribe((e: SelectEvent) => {
          const selected = e.selected[0];
          if (selected) {
            this.overlay.enabled = false;
            this.overlay.close();
            this.map.addInteraction(rotate);
            this.map.addInteraction(translate);
            setPivot(selected);
            setRotateIcon(selected);
            (rotate.arrowFeature_ as Feature).setStyle((f, r) =>
              this.dataOLStyleService.createRotateStyle(f, r)
            );
          } else {
            this.overlay.enabled = true;
            this.map.removeInteraction(rotate);
            this.map.removeInteraction(translate);
          }
          selected.changed();
        }),
      ]
    );
  }
}
