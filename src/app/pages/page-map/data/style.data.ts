import { Feature, View } from "ol";
import { Fill, Stroke, Style, Text } from "ol/style";
import { LayerKey, LayerProperties } from "../openlayers/ol-model";
import { StyleLike } from "ol/style/Style";
import { round } from "@turf/turf";

const toZoom = (resolution) =>
  Math.log2(156543.03390625) - Math.log2(resolution);

export const styleBuilding = (feature: Feature, resolution) => {
  var zoom = toZoom(resolution);
  return [
    new Style({
      stroke: new Stroke({
        color: "transparent",
      }),
      fill: new Fill({
        color: "rgba(130, 130, 130, 1)",
      }),
    }),
  ];
};
export const styleRoadFill = (feature: Feature, resolution) => {
  var zoom = toZoom(resolution);
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
export const styleParcel = (feature: Feature, resolution) => {
  var zoom = toZoom(resolution);
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
export const styleRoads = (feature: Feature, resolution) => {
  var zoom = toZoom(resolution);
  return [
    new Style({
      stroke: new Stroke({
        color: "rgba(0, 0, 0, 0.3)",
        width: 1,
      }),
      fill: new Fill({
        color: "transparent",
      }),
    }),
  ];
};
export const styleThrees = (feature: Feature, resolution) => {
  var zoom = toZoom(resolution);
  const isEvergreen = feature.getProperties()["type"] === "evergreen";
  return [
    new Style({
      stroke: new Stroke({
        color: "transparent",
        width: 1,
      }),
      fill: new Fill({
        color: isEvergreen ? "#1C5C24" : "#469E4A",
      }),
    }),
  ];
};

export const styleIsochrone: StyleLike = (feature: Feature, resolution) => {
  var zoom = toZoom(resolution);
  const elv = round(Number(feature.getProperties()["Contour"]));
  const minor = elv % 5 === 0;
  const major = elv % 10 === 0;

  let color = "rgba(0, 0, 0, 0.5)";
  // if (minor) color = "rgba(0, 100, 0, 0.8)";
  // if (major) color = "rgba(0, 0, 0, 0.9)";

  let width = major ? 1 : minor ? 0.5 : 0.3;

  if (zoom > 16) {
    // width = 0.5;
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

  if (zoom > 16 && major) {
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
