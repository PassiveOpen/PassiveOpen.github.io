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
import { Point, Polygon } from "ol/geom";
import { Select, Translate } from "ol/interaction.js";
import {
  angleBetween,
  angleXY,
  rotateXY,
  round,
} from "src/app/shared/global-functions";
import { OLBaseMapService } from "./openlayers/ol-basemap.service";
import { OLMeasureService } from "./openlayers/ol-measure.service";
import { fromEvent, map, tap } from "rxjs";
import { Circle, Fill, Icon, Stroke, Style, Text } from "ol/style";
import { OLViewService } from "./openlayers/ol-view.service";
import BaseLayer from "ol/layer/Base";
import { fromLonLat, toLonLat } from "ol/proj";
import { Wall, WallSide, WallType } from "src/app/model/specific/wall.model";
import { Floor, Graphic } from "src/app/components/enum.data";

import RotateFeatureInteraction from "ol-rotate-feature";
import { SelectEvent } from "ol/interaction/Select";
import { Subscription } from "rxjs";
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
import { MapOverlayComponent } from "./map-overlay/map-overlay.component";
import { HttpClient } from "@angular/common/http";
import { Coordinate } from "ol/coordinate";

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
  origin: xy = [1519995, 7542140]; // 3857
  rotation = 0;

  roofCenter: Point = new Point(this.origin);

  houseFeature = new Feature<Polygon>({
    roofCenter: this.roofCenter,
    roofCenterShow: false,
  });

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
    private httpClient: HttpClient
  ) {}

  ngOnDestroy(): void {
    [this.olViewService].forEach((x) => x.onDestroy());
    this.subscriptions.forEach((x) => x.unsubscribe());
  }

  ngAfterViewInit(): void {
    this.appService.scroll$.next({
      ...this.appService.scroll$.value,
      graphic: Graphic.map,
    });
    this.getHousePolygon();
    this.layers = [
      ...this.olBaseMapService.getBaseLayers(),
      ...this.olLayerService.getLayers(this.houseFeature),
    ];

    this.zone.runOutsideAngular(() => this.initMap());
  }

  fromLocalToLonLat(xy: xy): xy {
    var r_earth = 6378.137;
    var pi = Math.PI;
    const { lat, lng } = this.house.orientation;
    const new_latitude = lat + ((xy[1] / r_earth) * (180 / pi)) / 1000;
    const new_longitude =
      lng +
      ((xy[0] / r_earth) * (180 / pi)) / Math.cos((lat * pi) / 180) / 1000;
    return fromLonLat([new_longitude, new_latitude]) as xy;
  }

  getHousePolygon() {
    this.house = this.houseService.house$.value;
    const { lat, lng } = this.house.orientation;
    this.origin = fromLonLat([lng, lat]) as xy;
    this.rotation = this.house.orientation.rotation;

    const walls = this.house.partsFlatten.filter(
      (x) => x instanceof Wall && x.type === WallType.outer
    ) as Wall[];

    let points = walls
      .filter((x) => x.floor === Floor.all)
      .flatMap((x) => x.sides[WallSide.out]);
    const coords = points
      .map((xy) => rotateXY(xy, this.house.centerHouse, 180 - this.rotation))
      .map((xy) => this.fromLocalToLonLat(xy));
    coords.push(coords[0]);

    const geom = this.turfService.coordsDissolveToPolygon(coords);
    this.houseFeature.setGeometry(geom);
  }

  initMap() {
    this.olViewService.init(this.origin, 15);

    this.map = new Map({
      view: this.olViewService.view,
      layers: this.layers,
      target: this.mapEl.nativeElement,
      overlays: [this.overlay.overlay],
    });

    this.addInteractions();
    this.olMeasureService.init(this.map);
    this.olBaseMapService.map = this.map;
    (window as any).map = this.map;
  }

  zoom(resolution) {
    return Math.log2(156543.03390625) - Math.log2(resolution);
  }

  addInteractions() {
    const createSelectStyle = (feature, resolution) => {
      var zoom = this.zoom(resolution);
      const rotate =
        this.houseFeature.getProperties()["roofCenterShow"] === true;

      const styles = [
        new Style({
          stroke: new Stroke({
            color: this.colorService.rgba(Color.accent, 0.9),
            width: 2,
          }),
          fill: new Fill({
            color: rotate
              ? this.colorService.rgba(Color.accent, 0.1)
              : this.colorService.rgba(Color.primary, 0.7),
          }),
          zIndex: 2,
        }),
      ];

      if (zoom < 16) {
        return [
          ...styles,
          new Style({
            geometry: "roofCenter",
            image: new Circle({
              radius: 14,
              stroke: new Stroke({
                width: 1,
                color: this.colorService.rgba(Color.accent, 0.9),
              }),
              fill: new Fill({
                color: "rgba(100, 100, 100, 1)",
              }),
            }),
            stroke: new Stroke({
              color: "rgba(0, 0, 0, 0.5)",
              width: 3,
            }),
            zIndex: Infinity,
            text: new Text({
              offsetX: 0,
              offsetY: 0,
              text: `open_with`,
              font: "normal 20px Material Icons",
              fill: new Fill({ color: "white" }),
            }),
          }),
        ];
      }

      if (rotate) {
        let offset = [-25, 25];
        if (this.rotation > 90 || this.rotation < -90) offset = [25, -25];
        styles.push(
          new Style({
            image: new Circle({
              radius: 30 / resolution,
              stroke: new Stroke({
                color: "rgba(10, 10,10, 0.3)",
                width: 2,
              }),
            }),
            geometry: "roofCenter",
            text: new Text({
              font: "14px sans-serif",
              overflow: true,
              // offsetX: offset[0],
              // offsetY: offset[1],
              fill: new Fill({
                color: this.colorService.rgb(Color.primary),
              }),
              text: `${this.rotation}°`,
            }),
          })
        );
      }

      return styles;
    };
    const createRotateStyle = (feature, resolution) => {
      var zoom = this.zoom(resolution);

      const styleRotateIcon = new Style({
        image: new Circle({
          radius: 14,
          stroke: new Stroke({
            width: 1,
            color: this.colorService.rgba(Color.accent, 0.9),
          }),
          fill: new Fill({
            color: "rgba(100, 100, 100, 1)",
          }),
        }),
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.5)",
          width: 3,
        }),
        zIndex: Infinity,
        text: new Text({
          offsetX: 0,
          offsetY: 0,
          text: `refresh`,
          font: "normal 20px Material Icons",
          fill: new Fill({ color: "white" }),
          rotation: -degToRad(this.rotation || 0),
        }),
      });

      if (zoom < 16) return [new Style({})];
      if (feature && feature.get("rotate-arrow")) return styleRotateIcon;
    };

    const getRotatePoint = () => {
      return angleXY(
        radToDeg(rotate.getAngle()) - 90,
        -30,
        this.roofCenter.getCoordinates() as xy
      );
    };
    const setPivot = () => {
      const coords = this.houseFeature
        .getGeometry()
        .getCoordinates()[0] as xy[];
      this.origin = coords[0];
      const point = this.turfService.getCenterOfMass(coords);
      this.roofCenter.setCoordinates(point.getCoordinates());
      const rotation = round(angleBetween(coords[2], coords[1], 1) + 180, 1);
      this.rotation = rotation;
    };
    const select = new Select({
      style: createSelectStyle,
    });
    const translate = new Translate({
      features: select.getFeatures(),
    });
    const rotate = new RotateFeatureInteraction({
      features: select.getFeatures(),
      style: createRotateStyle,
    });
    const setRotateIcon = () => {
      rotate.setAnchor(this.roofCenter.getCoordinates());
      rotate.setAngle((0 * Math.PI) / 180);
      rotate.arrowFeature_.getGeometry().setCoordinates(getRotatePoint());
    };
    this.map.addInteraction(select);

    this.subscriptions.push(
      ...[
        fromEvent(translate, "translateend").subscribe((e) => {
          setRotateIcon();
        }),
        fromEvent(translate, "translating").subscribe((e) => {
          setRotateIcon();
        }),
        fromEvent(this.houseFeature, "change").subscribe((e) => {
          setPivot();
          const xy = rotate.getAnchor();
          if (!xy) return;
          const [lng, lat] = toLonLat(xy).map((x) => x.toFixed(8));
          console.log(`${this.rotation}°,  ${lat},${lng}`);
        }),
        fromEvent(rotate, "rotatestart").subscribe((e) => {
          this.houseFeature.setProperties({
            roofCenterShow: true,
          });
        }),
        fromEvent(rotate, "rotateend").subscribe((e) => {
          this.houseFeature.setProperties({
            roofCenterShow: false,
          });
          rotate.features_.pop();
          rotate.features_.push(this.houseFeature);
          setPivot();
          setRotateIcon();
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
            (rotate.arrowFeature_ as Feature).setStyle(createRotateStyle);
          } else {
            this.overlay.enabled = true;
            this.map.removeInteraction(rotate);
            this.map.removeInteraction(translate);
          }
        }),
        fromEvent(this.map, "singleclick").subscribe(
          (event: MapBrowserEvent<any>) =>
            this.overlay.setPopup(event.coordinate, () =>
              this.identify(event.coordinate)
            )
        ),
      ]
    );
  }

  identify(coordinate: Coordinate) {
    const layer = this.olLayerService.layers$.value.find(
      (x) => x.getProperties().key === LayerKey.test
    );
    const url = layer.getSource().getUrl().trim("/") + "/identify";

    const params = {
      geometry: `${coordinate[0]}, ${coordinate[1]}`,
      geometryType: "esriGeometryPoint",
      sr: 3857,
      layers: "all",
      tolerance: "2",
      mapExtent: `${coordinate[0]}, ${coordinate[1]},${coordinate[0]}, ${coordinate[1]}`,
      imageDisplay: "2,2,2",
      returnGeometry: false,
      f: "pjson",
    };

    return this.httpClient
      .get(url, {
        params,
      })
      .pipe(
        tap((response: any) => {
          if (response.error) {
            console.error(`ESRI error`, response.error);
            throw new Error(response.error.message);
          }
        }),
        map((response: any) => {
          return response.results
            .map((feature) => {
              console.log(feature);

              return `${feature.layerName} - ${feature.attributes.layerName}`;
            })
            .join("<br/>");
        })
      );
  }
}
