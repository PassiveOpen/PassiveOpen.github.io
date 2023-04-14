import { View } from "ol";
import { Coordinate } from "ol/coordinate";
import { AnimationOptions } from "ol/View";
import { Fill, Stroke, Style } from "ol/style";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { environment } from "src/environments/environment";
import ImageLayer from "ol/layer/Image";
import ImageArcGISRest from "ol/source/ImageArcGISRest";
import BaseLayer from "ol/layer/Base";
import GeoJSON from "ol/format/GeoJSON.js";
import { LayerKey, LayerProperties } from "../openlayers/ol-model";
import {
  styleBuilding,
  styleIsochrone,
  styleParcel,
  styleRoadFill,
  styleRoads,
  styleThrees,
} from "./style.data";
import { round } from "src/app/shared/global-functions";

export const extraLayers = [
  // new ImageLayer({
  //   source: new ImageArcGISRest({
  //     url: "https://maps.geoinfomittskane.se/arcgis/rest/services/GeoInfoMittskane/Fastighetsytor_Horby_Hoor/MapServer",
  //   }),
  // }),
  // new ImageLayer({
  //   source: new ImageArcGISRest({
  //     url: "https://maps.geoinfomittskane.se/arcgis/rest/services/ExternData/Omradesskydd_extern/MapServer",
  //   }),
  //   properties: new LayerProperties({
  //     key: LayerKey.test,
  //     name: "Test thing",
  //   }),
  //   zIndex: 1,
  //   visible: false,
  // }),
  // new ImageLayer({
  //   source: new ImageArcGISRest({
  //     url: "https://maps.geoinfomittskane.se/arcgis/rest/services/Planlagd_och_f%C3%B6reslagen_mark_f%C3%B6r_bostad__service_och_verksamhet_i_H%C3%B6rby_kommun_attach/MapServer",
  //   }),
  // }),
  new ImageLayer({
    source: new ImageArcGISRest({
      url: "https://maps.geoinfomittskane.se/arcgis/rest/services/Orto/LAS2019/MapServer",
      params: {},
    }),
    properties: new LayerProperties({
      key: LayerKey.dem,
      name: "DEM",
      maptip: true,
      maptipCallback: (feature: any) =>
        `Elevation ${round(feature.attributes["Pixel Value"], 0)}m`,
    }),

    zIndex: 1,
    opacity: 0.7,
    visible: false,
  }),

  new VectorLayer({
    source: new VectorSource({
      url: "/assets/data/threes.json",
      format: new GeoJSON(),
    }),
    properties: new LayerProperties({
      key: LayerKey.threes,
      name: "threes",
    }),
    zIndex: 1,
    visible: true,
    opacity: 0.4,
    style: styleThrees,
  }),

  new VectorLayer({
    source: new VectorSource({
      url: "/assets/data/kallmurar.json",
      format: new GeoJSON(),
    }),
    properties: new LayerProperties({
      key: LayerKey.kallmurar,
      name: "kallmurar",
    }),
    zIndex: 1,
    visible: true,
    opacity: 0.4,
    style: styleThrees,
  }),
  new VectorLayer({
    source: new VectorSource({
      url: "/assets/data/elevation.json",
      format: new GeoJSON(),
    }),
    properties: new LayerProperties({
      key: LayerKey.heightLines,
      name: "Isochrone",
    }),
    zIndex: 1,
    visible: true,
    style: styleIsochrone,
  }),
  new VectorLayer({
    source: new VectorSource({
      url: "/assets/data/roads.json",
      format: new GeoJSON(),
    }),
    properties: new LayerProperties({
      key: LayerKey.roads,
      name: "Roads",
    }),
    zIndex: 1,
    visible: true,
    style: styleRoads,
  }),
  new VectorLayer({
    source: new VectorSource({
      url: "/assets/data/roadFill.json",
      format: new GeoJSON(),
    }),
    properties: new LayerProperties({
      key: LayerKey.roadFills,
      name: "roadFill",
    }),
    zIndex: 1,
    visible: true,
    style: styleRoadFill,
  }),

  new VectorLayer({
    source: new VectorSource({
      url: "/assets/data/parcel.json",
      format: new GeoJSON(),
    }),
    properties: new LayerProperties({
      key: LayerKey.parcelBorders,
      name: "Tomter",
      maptip: false,
      maptipCallback: (feature: any) => {
        // console.log(feature);
        return `${round(feature.getGeometry().getArea() / 10000, 1)}ha tomt`;
      },
    }),
    zIndex: 1,
    visible: true,
    style: styleParcel,
  }),
  new VectorLayer({
    source: new VectorSource({
      url: "/assets/data/building.json",
      format: new GeoJSON(),
    }),
    properties: new LayerProperties({
      key: LayerKey.building,
      name: "building",
    }),
    zIndex: 1,
    visible: true,
    style: styleBuilding,
  }),

  new VectorLayer({
    source: new VectorSource({
      url: "/assets/data/water.json",
      format: new GeoJSON(),
    }),
    properties: new LayerProperties({
      key: LayerKey.water,
      name: "water",
    }),
    zIndex: 1,
    visible: true,
  }),

  new ImageLayer({
    source: new ImageArcGISRest({
      url: "https://maps.geoinfomittskane.se/arcgis/rest/services/GeoInfoMittskane/Baskarta_tomtkarta_Hby/MapServer",
    }),
    properties: new LayerProperties({
      key: LayerKey.test,
    }),
    visible: false,
    zIndex: 1,
  }),
];
