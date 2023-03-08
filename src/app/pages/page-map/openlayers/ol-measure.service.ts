import { Injectable } from "@angular/core";
import { Map, MapBrowserEvent } from "ol";
import {
  Circle as CircleStyle,
  Fill,
  RegularShape,
  Stroke,
  Style,
  Text,
} from "ol/style";
import { Draw, Modify, Select } from "ol/interaction";
import { Geometry, LineString, Point } from "ol/geom";
import VectorSource from "ol/source/Vector.js";
import { Vector as VectorLayer } from "ol/layer";
import { getArea, getLength } from "ol/sphere";
import { angleBetween } from "src/app/shared/global-functions";
import { Subscription, fromEvent, filter } from "rxjs";

enum DrawType {
  Length = "LineString",
  Area = "Polygon",
  Point = "Point", // only for style
}

@Injectable({
  providedIn: "root",
})
export class OLMeasureService {
  DrawType = DrawType; //enum
  active = false;
  showSegments = true;
  clearPrevious = true;
  drawType = DrawType.Length;
  tipPoint;
  segmentStyles = [];
  source = new VectorSource();
  vectorLayer: VectorLayer<VectorSource<Geometry>>;
  draw: Draw;
  map: Map;
  tip = "";
  halfAreaTip = `Click to start`;
  get type() {
    return this.drawType === DrawType.Area ? "area" : "distance";
  }
  get idleTip() {
    return `Start measurement of ${this.type}`;
  }
  get activeTip() {
    return `Double click to close ${this.type}`;
  }
  subscriptions: Subscription[] = [];

  style = new Style({
    fill: new Fill({
      color: "rgba(255, 255, 255, 0.2)",
    }),
    stroke: new Stroke({
      color: "rgba(0, 0, 0, 0.5)",
      lineDash: [10, 10],
      width: 2,
    }),
    image: new CircleStyle({
      radius: 5,
      stroke: new Stroke({
        color: "rgba(0, 0, 0, 0.7)",
      }),
      fill: new Fill({
        color: "rgba(255, 255, 255, 0.2)",
      }),
    }),
  });
  labelStyle = new Style({
    text: new Text({
      font: "14px Calibri,sans-serif",
      fill: new Fill({
        color: "rgba(255, 255, 255, 1)",
      }),
      backgroundFill: new Fill({
        color: "rgba(0, 0, 0, 0.7)",
      }),
      padding: [3, 3, 3, 3],
      textBaseline: "bottom",
      offsetY: -15,
    }),
    image: new RegularShape({
      radius: 8,
      points: 3,
      angle: Math.PI,
      displacement: [0, 8],
      fill: new Fill({
        color: "rgba(0, 0, 0, 0.7)",
      }),
    }),
  });
  tipStyle = new Style({
    text: new Text({
      font: "12px Calibri,sans-serif",
      fill: new Fill({
        color: "rgba(255, 255, 255, 1)",
      }),
      backgroundFill: new Fill({
        color: "rgba(0, 0, 0, 0.4)",
      }),
      padding: [2, 2, 2, 2],
      textAlign: "left",
      offsetX: 15,
    }),
  });
  modifyStyle = new Style({
    image: new CircleStyle({
      radius: 5,
      stroke: new Stroke({
        color: "rgba(0, 0, 0, 0.7)",
      }),
      fill: new Fill({
        color: "rgba(0, 0, 0, 0.4)",
      }),
    }),
    text: new Text({
      text: "Drag to modify",
      font: "12px Calibri,sans-serif",
      fill: new Fill({
        color: "rgba(255, 255, 255, 1)",
      }),
      backgroundFill: new Fill({
        color: "rgba(0, 0, 0, 0.7)",
      }),
      padding: [2, 2, 2, 2],
      textAlign: "left",
      offsetX: 15,
    }),
  });
  segmentStyle = new Style({
    text: new Text({
      font: "12px Calibri,sans-serif",
      fill: new Fill({
        color: "rgba(255, 255, 255, 1)",
      }),
      backgroundFill: new Fill({
        color: "rgba(0, 0, 0, 0.4)",
      }),
      padding: [2, 2, 2, 2],
      textBaseline: "bottom",
      offsetY: -12,
    }),
    image: new RegularShape({
      radius: 6,
      points: 3,
      angle: Math.PI,
      displacement: [0, 7],
      fill: new Fill({
        color: "rgba(0, 0, 0, 0.4)",
      }),
    }),
  });
  modify = new Modify({
    source: this.source,
    style: this.modifyStyle,
  });

  constructor() {}

  init(map: Map) {
    this.map = map;
    this.addVectorLayers();
    // this.activate(true);
  }

  nextType() {
    if (this.drawType === DrawType.Area) {
      this.drawType = DrawType.Length;
    } else {
      this.drawType = DrawType.Area;
    }
    this.source.clear();
    this.activate(false);
  }

  /**
   * Add's a vectorLayer to the map, only at render of this component
   */
  addVectorLayers() {
    this.vectorLayer = new VectorLayer({
      source: this.source,
      style: (feature) => this.styleFunction(feature),
      zIndex: 9990,
      className: "measureTool",
      properties: {
        key: "measureTool",
      },
    });
    this.map.addLayer(this.vectorLayer);
  }

  activate(active?: boolean) {
    if (active === undefined) active = !this.active;
    if (!active) {
      this.stopMeasure();
      this.active = false;
    } else {
      this.stopMeasure();
      this.active = true;
      this.segmentStyles = [this.segmentStyle];
      this.draw = new Draw({
        geometryName: "measure",
        source: this.source,
        type: this.drawType,
        style: (feature) => this.styleFunction(feature),
        condition: (e) => {
          const pointerEvent = e.activePointers[0];
          return pointerEvent.buttons === 1; // left click
        },
      });

      this.subscriptions.push(
        ...[
          fromEvent(document, "mousedown", { passive: false })
            .pipe(filter((e: MouseEvent) => e.buttons === 2)) // right click
            .subscribe((e) => {
              // e.preventDefault();
              // e.stopImmediatePropagation();
              console.log(this.segmentStyles.length);

              if (this.segmentStyles.length - 1 === 0) {
                this.draw.abortDrawing();
              } else {
                this.draw.finishDrawing();
              }
            }),
          fromEvent(this.draw, "drawstart").subscribe(() => {
            this.modify.setActive(false);
            if (this.clearPrevious) {
              this.source.clear();
            }
          }),

          fromEvent(this.draw, "drawend").subscribe(() => {
            this.modify.setActive(true);
            this.modifyStyle.setGeometry(this.tipPoint);
            this.map.once("pointermove", () => {
              this.modifyStyle.setGeometry(undefined);
            });
            this.tip = this.idleTip;
          }),
        ]
      );
      this.map.addInteraction(this.modify);
      this.map.addInteraction(this.draw);
      this.tip = this.idleTip;
    }
    this.modify.setActive(this.active);
    this.activateOtherInteractions();
  }

  stopMeasure() {
    this.map.removeInteraction(this.modify);
    this.map.removeInteraction(this.draw);
    this.source.clear();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  /**
   * Toggle other Openlayers Selects and Modifies
   */
  activateOtherInteractions() {
    this.map
      .getInteractions()
      .getArray()
      .filter(
        (x) => x instanceof Select || x instanceof Modify || x instanceof Draw
      )
      .filter((x) => x !== this.draw && x !== this.modify) // dont change this measure-tool
      .forEach((interaction) => {
        interaction.setActive(!this.active); // opposite of measure-tool
      });
  }

  formatLength(line) {
    const length = getLength(line);
    if (length > 100) {
      return Math.round((length / 1000) * 100) / 100 + " km";
    } else {
      return Math.round(length * 100) / 100 + " m";
    }
  }

  formatArea(polygon) {
    const area = getArea(polygon);
    if (area > 10000) {
      return Math.round((area / 1000000) * 100) / 100 + " km\xB2";
    } else {
      return Math.round(area * 100) / 100 + " m\xB2";
    }
  }

  /**
   *
   * @param feature drawing feature
   * @returns styles for OpenLayers
   */
  styleFunction(feature) {
    const styles = [this.style];
    const geometry = feature.getGeometry();
    const drawType = geometry.getType();
    let point: Point, label: string, line: LineString;

    if (drawType === DrawType.Area) {
      point = geometry.getInteriorPoint();
      label = this.formatArea(geometry);
      line = new LineString(geometry.getCoordinates()[0]);
      this.tip =
        line.getCoordinates().length < 4 ? this.halfAreaTip : this.activeTip;
    } else if (drawType === DrawType.Length) {
      point = new Point(geometry.getLastCoordinate());
      label = this.formatLength(geometry);
      line = geometry;
      this.tip = this.activeTip;
    }

    if (this.showSegments && line) {
      let count = 0;

      line.forEachSegment((a, b) => {
        const segment = new LineString([a, b]);

        const label = `${this.formatLength(segment)}`;
        if (this.segmentStyles.length - 1 < count) {
          this.segmentStyles.push(this.segmentStyle.clone());
        }
        const segmentPoint = new Point(segment.getCoordinateAt(0.5));
        this.segmentStyles[count].setGeometry(segmentPoint);
        this.segmentStyles[count].getText().setText(label);
        styles.push(this.segmentStyles[count]);
        count++;
      });
    }

    // Set label
    if (label) {
      this.labelStyle.setGeometry(point);
      this.labelStyle.getText().setText(label);
      styles.push(this.labelStyle);
    }

    // New label at (re)start
    if (
      this.tip &&
      drawType === DrawType.Point &&
      !this.modify.getOverlay().getSource().getFeatures().length
    ) {
      this.tipPoint = geometry;
      this.tipStyle.getText().setText(this.tip);
      styles.push(this.tipStyle);
    }

    return styles;
  }
}
