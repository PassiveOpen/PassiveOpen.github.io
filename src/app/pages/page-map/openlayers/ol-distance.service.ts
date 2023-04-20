import { Injectable } from "@angular/core";
import { Feature, Map, MapBrowserEvent } from "ol";

import { Draw, Modify, Select } from "ol/interaction";
import { Geometry, LineString, Point, Polygon } from "ol/geom";
import VectorSource from "ol/source/Vector.js";
import { Vector as VectorLayer } from "ol/layer";
import { getArea, getLength } from "ol/sphere";
import { angleBetween, round } from "src/app/shared/global-functions";
import {
  Subscription,
  fromEvent,
  filter,
  Subject,
  interval,
  merge,
  first,
  combineLatest,
} from "rxjs";
import { OLLayerService } from "./ol-layers.service";
import { LayerKey } from "./ol-model";

import { Coordinate } from "ol/coordinate";
import { House } from "src/app/house/house.model";
import { HouseService } from "src/app/house/house.service";
import { fromLonLat } from "ol/proj";
import { feature } from "@turf/turf";
import { TurfService } from "./turf.service";
import { getCenter } from "ol/extent";

interface Line {
  text: string;
  coords: (line: Line) => [Coordinate, Coordinate];
  geometry?: LineString;
  toGeometry?: LineString | Point[];
  dist: number;
  feature?: Feature<LineString>;
}

@Injectable({
  providedIn: "root",
})
export class OLDistanceService {
  source = new VectorSource();
  vectorLayer: VectorLayer<VectorSource<Geometry>>;
  draw: Draw;
  map: Map;
  onDraw$ = new Subject();
  subscriptions: Subscription[] = [];
  active = false;
  houseFeature: Feature<Polygon>;

  lines: Line[] = [];

  constructor(
    private olLayerService: OLLayerService,
    private houseService: HouseService,
    private turfService: TurfService
  ) {}

  init(map: Map, houseFeature) {
    this.houseFeature = houseFeature;
    this.map = map;
    this.vectorLayer = this.olLayerService.getLayer(
      LayerKey.distanceLines
    ) as any;
    this.source = this.vectorLayer.getSource();

    this.initLines();
    this.subscriptions.push(
      ...[
        this.houseService.house$.subscribe(() => {
          this.updateLines();
        }),
      ]
    );
  }
  updateLines() {
    this.lines.forEach((line) => {
      if (line.geometry === undefined) {
        line.geometry = new LineString([]);
        line.feature = new Feature({
          geometry: line.geometry,
        });
        this.source.addFeature(line.feature);
      }
      line.geometry.setCoordinates(line.coords(line));
      line.feature.setProperties({
        text: line.text,
        dist: line.dist,
      });
    });
  }

  initLines() {
    combineLatest([
      fromEvent(
        this.olLayerService.getLayer(LayerKey.parcelBorders),
        "postrender"
      ),
      fromEvent(this.olLayerService.getLayer(LayerKey.building), "postrender"),
    ])
      .pipe(first())
      .subscribe(() => {
        this.initLinesAfterLoad();
      });
  }

  initLinesAfterLoad() {
    this.lines = [];
    const parcelLayer = this.olLayerService.getLayer(
      LayerKey.parcelBorders
    ) as VectorLayer<VectorSource<LineString>>;

    const buildLayer = this.olLayerService.getLayer(
      LayerKey.building
    ) as VectorLayer<VectorSource<Polygon>>;

    const closestLine = (i) =>
      parcelLayer.getSource().getClosestFeatureToCoordinate(i);

    const housesPerimeter = buildLayer
      .getSource()
      .getFeaturesInExtent([
        1519739, 754186, 1520339.2736772515, 7542519.297257925,
      ]);

    this.lines.push(
      {
        text: "1",
        coords: (line) => {
          const { dist, housePoint, linePoint } =
            this.turfService.closestPointBetweenLineAndPolygon(
              line.toGeometry as LineString,
              this.houseFeature.get("footPrint")
            );

          line.dist = dist;
          return [housePoint, linePoint];
        },
        dist: 0,
        toGeometry: closestLine([
          1520072.51521608, 7541883.7994233975,
        ]).getGeometry(),
      },
      {
        text: "2",
        coords: (line) => {
          const { dist, housePoint, linePoint } =
            this.turfService.closestPointBetweenLineAndPolygon(
              line.toGeometry as LineString,
              this.houseFeature.get("footPrint")
            );
          line.dist = dist;
          return [housePoint, linePoint];
        },
        dist: 0,
        toGeometry: closestLine([
          1519938.113848764, 7542367.323555815,
        ]).getGeometry(),
      },
      {
        text: "3",
        coords: (line) => {
          const { dist, housePoint, linePoint } =
            this.turfService.closestPointBetweenPointsAndPolygon(
              line.toGeometry as Point[],
              this.houseFeature.get("footPrint")
            );
          line.dist = dist;
          return [housePoint, linePoint];
        },
        dist: 0,
        toGeometry: housesPerimeter.flatMap((x) =>
          x
            .getGeometry()
            .getCoordinates()[0]
            .map((y) => new Point(y))
        ),
      }
    );

    this.updateLines();
  }
}
