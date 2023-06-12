import { Feature, View } from "ol";
import { Circle, Fill, Stroke, Style, Text } from "ol/style";
import { LayerKey, LayerProperties } from "../openlayers/ol-model";
import { StyleLike } from "ol/style/Style";
import { round } from "@turf/turf";
import colormap from "colormap";
import { Injectable } from "@angular/core";
import { Color, ColorService } from "src/app/components/color/color.service";
import { degToRad } from "three/src/math/MathUtils";

@Injectable({
  providedIn: "root",
})
export class DataOLStyleService {
  font = (size = 12) => `bold ${size}px Roboto, "Helvetica Neue", sans-serif`;
  demMin = 90 / 255;
  demMax = 150 / 255;
  shadowContrast = 0.18;
  shadowOpacity = 0.15;

  rotateZoom = 17.5;

  constructor(private colorService: ColorService) {}

  getColorStops(name, min, max, steps, reverse) {
    const delta = (max - min) / (steps - 1);
    const stops = new Array(steps * 2);

    const colors = colormap({ colormap: name, nshades: steps, format: "rgba" });
    if (reverse) {
      colors.reverse();
    }
    for (let i = 0; i < steps; i++) {
      stops[i * 2] = min + i * delta;
      stops[i * 2 + 1] = colors[i];
    }
    return [0, [0, 0, 0, 0], 0.01, ...stops.slice(1)];
  }

  toZoom = (resolution) => Math.log2(156543.03390625) - Math.log2(resolution);

  normalize(value) {
    return ["/", ["-", value, ["var", "min"]], ["var", "span"]];
  }

  styleWater: StyleLike = (feature: Feature, resolution) => {
    var zoom = this.toZoom(resolution);
    return [
      new Style({
        stroke: new Stroke({
          color: "transparent",
        }),
        fill: new Fill({
          color: "rgba(148, 218, 237, 0.5)",
        }),
      }),
    ];
  };
  styleBuilding: StyleLike = (feature: Feature, resolution) => {
    var zoom = this.toZoom(resolution);
    return [
      new Style({
        stroke: new Stroke({
          color: "transparent",
        }),
        fill: new Fill({
          color: "rgba(130, 130, 130, 1)",
        }),
      }),
      new Style({
        geometry: "roofLines",
        stroke: new Stroke({
          color: "rgba(130, 255, 130, 1)",
          width: 4,
        }),
      }),
    ];
  };
  styleRoadFill: StyleLike = (feature: Feature, resolution) => {
    var zoom = this.toZoom(resolution);
    return [
      new Style({
        stroke: new Stroke({
          color: "transparent",
        }),
        fill: new Fill({
          color: "rgba(200, 200, 200, 0.7)",
        }),
      }),
    ];
  };
  styleParcel: StyleLike = (feature: Feature, resolution) => {
    var zoom = this.toZoom(resolution);
    return [
      new Style({
        stroke: new Stroke({
          color: "rgba(50, 0, 0, 0.5)",
          width: 1,
          lineDash: [14, 6, 3, 6],
        }),
        fill: new Fill({
          color: "transparent",
        }),
      }),
    ];
  };
  styleKallmurar: StyleLike = (feature: Feature, resolution) => {
    var zoom = this.toZoom(resolution);
    return [
      new Style({
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.5)",
          width: 1,
          // lineDash: [30, 6],
        }),
        fill: new Fill({
          color: "transparent",
        }),
      }),
    ];
  };
  styleRoads: StyleLike = (feature: Feature, resolution) => {
    var zoom = this.toZoom(resolution);
    return [
      new Style({
        stroke: new Stroke({
          color: "rgba(99, 99, 99, 0.3)",
          width: 1,
        }),
        fill: new Fill({
          color: "transparent",
        }),
      }),
    ];
  };
  styleThrees: StyleLike = (feature: Feature, resolution) => {
    var zoom = this.toZoom(resolution);
    const isEvergreen = feature.getProperties()["type"] === "evergreen";
    const standalone = feature.getProperties()["type"] === "standalone";
    return [
      new Style({
        stroke: new Stroke({
          color: standalone ? "rgba(33, 110, 26, 0.8)" : "transparent",
          width: 0.6,
        }),
        fill: new Fill({
          color: standalone
            ? "rgba(152, 235, 64, 0.5)"
            : isEvergreen
            ? "rgba(99, 141, 58, 0.5)"
            : "rgba(164, 216, 109, 0.5)",
        }),
      }),
    ];
  };
  styleIsochrone: StyleLike = (feature: Feature, resolution) => {
    var zoom = this.toZoom(resolution);
    const elv = round(Number(feature.getProperties()["Contour"]));
    const minor = elv % 5 === 0;
    const major = elv % 10 === 0;

    let color = "rgba(0, 0, 0, 0.5)";
    // if (minor) color = "rgba(0, 100, 0, 0.8)";
    // if (major) color = "rgba(0, 0, 0, 0.9)";

    let width = major ? 1 : minor ? 0.5 : 0.3;

    if (zoom >= 16) {
      width = 0.5;
      color = "rgba(0, 0, 0, 0.5)";
    }

    const styles = [
      new Style({
        stroke: new Stroke({
          color,
          width,
        }),
      }),
    ];

    if (zoom < 16 && major) {
      styles.push(
        new Style({
          text: new Text({
            text: `${elv}`,
            fill: new Fill({
              color: "rgba(255, 255, 255, 0.8)",
            }),
            stroke: new Stroke({
              color: "rgba(0, 0, 0, 0.8)",
              width: 2,
            }),
          }),
        })
      );
    }
    return styles;
  };
  styleDistance: StyleLike = (feature: Feature, resolution) => {
    const styles = [];
    var zoom = this.toZoom(resolution);
    let color = "rgba(0, 0, 0, 0.5)";
    let width = 1;
    const text = feature.getProperties()["text"];
    const dist = feature.getProperties()["dist"];

    if (zoom < 999) {
      width = 2;
      color = "rgba(0, 0, 0, 0.5)";
      styles.push(
        new Style({
          text: new Text({
            font: this.font(),
            text: `${dist}`,
            fill: new Fill({
              color: "rgba(0, 0, 0, 0.8)",
            }),
            stroke: new Stroke({
              color: "rgba(255, 255, 255, 0.8)",
              width: 3,
            }),
          }),
        })
      );
    }

    styles.push(
      new Style({
        stroke: new Stroke({
          color,
          width,
        }),
      })
    );
    return styles;
  };

  DEMStyle = {
    variables: {
      min: this.demMin,
      max: this.demMax,
      span: this.demMax - this.demMin,
    },
    color: [
      "interpolate",
      ["linear"],
      this.normalize(["band", 1]),
      ...this.getColorStops("blackbody", 0, 1, 10, true),
    ],
  };

  ShadowStyle = {
    variables: {
      contrast: this.shadowContrast,
    },
    color: [
      "interpolate",
      ["linear"],
      ["band", 1],
      0,
      [0, 0, 0, 0],
      0.8,
      [0, 0, 0, 0],
      1,
      [255, 255, 255, 0.8],
    ],
  };

  styleHouse = (feature: Feature, resolution, selected) => {
    var zoom = this.toZoom(resolution);
    const rotate = feature.getProperties()["roofCenterShow"] === true;

    const styles = [
      new Style({
        geometry: "roofLines",
        stroke: new Stroke({
          color: "rgba(83, 83, 83, 1)",
          width: 1,
        }),
      }),
      new Style({
        geometry: "footPrint",
        stroke: new Stroke({
          // color: "transparent",
          color: selected
            ? this.colorService.rgba(Color.accent, 0.9)
            : "rgba(83, 83, 83, 1)",
        }),
        fill: new Fill({
          color: selected
            ? this.colorService.rgba(Color.accent, 0.5)
            : "rgba(184, 184, 184, 0.5)",
        }),
      }),
      // new Style({
      //   stroke: new Stroke({
      //     color: "rgba(255, 83, 140, 1)",
      //     width: 10,
      //   }),
      // }),
    ];

    if (zoom < this.rotateZoom && selected) {
      styles.push(
        ...[
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
        ]
      );
    }

    if (rotate) {
      let offset = [-25, 25];
      if (
        feature.getProperties()["rotation"] > 90 ||
        feature.getProperties()["rotation"] < -90
      )
        offset = [25, -25];
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
            text: `${feature.getProperties()["rotation"]}°`,
          }),
        })
      );
    }
    return styles;
  };
  createRotateStyle = (feature, resolution) => {
    var zoom = this.toZoom(resolution);

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
        rotation: feature.getProperties()["rotation"],
      }),
    });

    if (zoom < this.rotateZoom) return [new Style({})];
    if (feature && feature.get("rotate-arrow")) return styleRotateIcon;
  };
}
