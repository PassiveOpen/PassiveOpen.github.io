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
import { Collection, Feature, Map, View } from "ol";
import Layer from "ol/layer/Layer";
import Source from "ol/source/Source";
import { AppService } from "src/app/app.service";
import { House, xy } from "src/app/house/house.model";
import { HouseService } from "src/app/house/house.service";
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource, { VectorSourceEvent } from "ol/source/Vector";
import { Geometry, Point, Polygon } from "ol/geom";
import { Footprint } from "src/app/model/specific/footprint";
import { Coordinate } from "ol/coordinate";
import Interaction from "ol/interaction/Interaction";
import Modify from "ol/interaction/Modify.js";
import {
  Select,
  Translate,
  defaults as defaultInteractions,
} from "ol/interaction.js";
import {
  angleBetween,
  angleXY,
  offset,
  rotateXY,
  round,
} from "src/app/shared/global-functions";
import { Basemap, OLBaseMapService } from "./openlayers/ol-basemap.service";
import TileSource from "ol/source/Tile";
import XYZ from "ol/source/XYZ";
import { OLMeasureService } from "./openlayers/ol-measure.service";
import { fromEvent } from "rxjs";
import { Circle, Fill, Stroke, Style, Text } from "ol/style";
import { OLViewService } from "./openlayers/ol-view.service";
import BaseLayer from "ol/layer/Base";
import { fromLonLat, toLonLat } from "ol/proj";
import { Wall, WallSide, WallType } from "src/app/model/specific/wall.model";
import { Floor } from "src/app/components/enum.data";

import * as turf from "@turf/turf";
import GeoJSON from "ol/format/GeoJSON.js";

import { Select as SelectInteraction } from "ol/interaction";
import RotateFeatureInteraction from "ol-rotate-feature";
import { SelectEvent } from "ol/interaction/Select";
import { Subscription } from "rxjs";
import { degToRad, radToDeg } from "three/src/math/MathUtils";
import { ColorService, Color } from "src/app/components/color/color.service";

const houseStyle = [
  new Style({
    stroke: new Stroke({
      color: "rgba(0, 0, 0, 0.5)",
      width: 2,
    }),
    fill: new Fill({
      color: "rgba(30, 30, 30, 0.5)",
    }),
    zIndex: 1,
  }),
];

@Component({
  selector: "app-page-map",
  templateUrl: "./page-map.component.html",
  styleUrls: ["./page-map.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild("mapEl") mapEl: ElementRef;
  house = this.houseService.house$.value;
  map: Map;
  layers: BaseLayer[];
  subscriptions: Subscription[] = [];
  origin: xy = [1519995, 7542140];
  angle = 0;

  roofCenter = new Point(this.origin);

  houseFeature = new Feature<Polygon>({
    roofCenter: this.roofCenter,
    roofCenterShow: false,
  });
  houseLayer = new VectorLayer({
    source: new VectorSource({
      features: [this.houseFeature],
    }),
    style: houseStyle,
  });

  constructor(
    private zone: NgZone,
    private houseService: HouseService,
    private olBaseMapService: OLBaseMapService,
    private olMeasureService: OLMeasureService,
    private olViewService: OLViewService,
    private colorService: ColorService
  ) {}

  ngOnDestroy(): void {
    [this.olViewService].forEach((x) => x.onDestroy());
    this.subscriptions.forEach((x) => x.unsubscribe());
  }

  ngAfterViewInit(): void {
    this.getHousePolygon();
    this.layers = [...this.olBaseMapService.getBaseLayers(), this.houseLayer];
    this.zone.runOutsideAngular(() => this.initMap());
  }

  fromLocalToLonLat(xy: xy): xy {
    var r_earth = 6378.137;
    var pi = Math.PI;
    const [lng, lat] = toLonLat(this.origin);
    const new_latitude = lat + ((xy[1] / r_earth) * (180 / pi)) / 1000;
    const new_longitude =
      lng +
      ((xy[0] / r_earth) * (180 / pi)) / Math.cos((lat * pi) / 180) / 1000;
    return fromLonLat([new_longitude, new_latitude]) as xy;
  }

  getHousePolygon() {
    this.house = this.houseService.house$.value;
    const walls = this.house.partsFlatten.filter(
      (x) => x instanceof Wall && x.type === WallType.outer
    ) as Wall[];

    let points = walls
      .filter((x) => x.floor === Floor.all)
      .flatMap((x) => x.sides[WallSide.out]);
    const coords = points
      .map((xy) => rotateXY(xy, this.house.centerHouse, 180))
      .map((xy) => this.fromLocalToLonLat(xy));
    coords.push(coords[0]);

    // dissolve via turf
    const geojson = new GeoJSON();
    const collection = turf.featureCollection([turf.polygon([coords])]);
    var concaved = turf.dissolve(collection);
    const geom = geojson.readFeatures(concaved)[0].getGeometry() as Polygon;

    this.houseFeature.setGeometry(geom);
  }

  initMap() {
    this.map = new Map({
      view: this.olViewService.view,
      layers: this.layers,
      target: this.mapEl.nativeElement,
    });

    this.addInteractions();
    this.olMeasureService.init(this.map);
    this.olBaseMapService.map = this.map;
    (window as any).map = this.map;
  }

  addInteractions() {
    const getRotatePoint = () => {
      return angleXY(
        radToDeg(rotate.getAngle()) - 90,
        -30,
        this.roofCenter.getCoordinates() as xy
      );
    };

    const style = (f, r) => {
      const rotate =
        this.houseFeature.getProperties()["roofCenterShow"] === true;

      const styles = [
        new Style({
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 0.5)",
            width: 5,
          }),
          fill: new Fill({
            color: rotate
              ? "rgba(255, 255, 255, 0)"
              : "rgba(255, 255, 255, 0.9)",
          }),
          zIndex: 2,
        }),
      ];

      if (rotate) {
        let offset = [-25, 25];
        if (this.angle > 90 || this.angle < -90) offset = [25, -25];
        styles.push(
          new Style({
            image: new Circle({
              radius: 30 / r,
              stroke: new Stroke({
                color: "rgba(10, 10,10, 0.1)",
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
                color: this.colorService.color[Color.primary],
              }),
              text: `${this.angle}°`,
            }),
          })
        );
      }

      return styles;
    };

    const select = new Select({
      style,
    });
    const translate = new Translate({
      features: select.getFeatures(),
    });

    const createStyle = (feature, resolution) => {
      switch (true) {
        case feature.get("rotate-arrow"):
          return new Style({
            image: new Circle({
              radius: 14,
              stroke: new Stroke({
                width: 1,
                color: "rgba(200, 0, 0, 0.5)",
              }),
              fill: new Fill({
                color: "rgba(100, 100, 100, 0.5)",
              }),
            }),
            stroke: new Stroke({
              color: "rgba(0, 0, 0, 0.5)",
              width: 3,
            }),
            zIndex: Infinity,
            text: new Text({
              offsetX: 0,
              offsetY: 1.5,
              text: "↻",
              font: "900 20px Lucida Sans Unicode",
              rotation: degToRad(this.angle || 0),
            }),
          });
      }
    };

    const rotate = new RotateFeatureInteraction({
      features: select.getFeatures(),
      style: createStyle,
    });
    this.map.addInteraction(select);

    const setPivot = () => {
      const coords = this.houseFeature
        .getGeometry()
        .getCoordinates()[0] as xy[];
      this.origin = coords[0];
      const geojson = new GeoJSON();
      const turfed = turf.centerOfMass(turf.polygon([coords]));
      const point = geojson.readFeatures(turfed)[0].getGeometry() as Point;
      this.roofCenter.setCoordinates(point.getCoordinates());
      const rotation = angleBetween(coords[0], coords[1], 1);
      this.angle = rotation;
    };

    const setRotateIcon = () => {
      rotate.setAnchor(this.roofCenter.getCoordinates());
      rotate.setAngle((0 * Math.PI) / 180);
      rotate.arrowFeature_.getGeometry().setCoordinates(getRotatePoint());
    };

    this.subscriptions.push(
      ...[
        fromEvent(translate, "translateend").subscribe((e) => {
          setRotateIcon();
        }),
        fromEvent(this.houseFeature, "change").subscribe((e) => {
          setPivot();
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
        }),
        fromEvent(select, "select").subscribe((e: SelectEvent) => {
          const selected = e.selected[0];

          if (selected) {
            this.map.addInteraction(rotate);
            this.map.addInteraction(translate);
            setPivot();
            setRotateIcon();
            // @ts-ignore
            (rotate.arrowFeature_ as Feature).setStyle(createStyle());
          } else {
            this.map.removeInteraction(rotate);
            this.map.removeInteraction(translate);
          }
        }),
      ]
    );
  }
}
