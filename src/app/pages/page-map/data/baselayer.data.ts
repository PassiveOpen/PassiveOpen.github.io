import TileLayer from "ol/layer/Tile";
import { BasemapKey, LayerProperties } from "../openlayers/ol-model";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import ImageLayer from "ol/layer/Image";
import ImageArcGISRest from "ol/source/ImageArcGISRest";

export const baseLayers = [
  new TileLayer({
    visible: false,
    properties: new LayerProperties({
      basemap: true,
      key: BasemapKey.OSM,
    }),
    source: new OSM(),
  }),

  new TileLayer({
    visible: false,
    properties: new LayerProperties({
      basemap: true,
      key: BasemapKey.OSMSatellite,
    }),
    source: new XYZ({
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      maxZoom: 19,
    }),
  }),
];

export const extraBaseLayers = [
  new TileLayer({
    visible: false,
    properties: new LayerProperties({
      basemap: true,
      key: BasemapKey.Google,
    }),
    source: new XYZ({
      url: "http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
    }),
  }),
  new TileLayer({
    visible: false,
    properties: new LayerProperties({
      basemap: true,
      key: BasemapKey.GoogleSatellite,
    }),
    source: new XYZ({
      url: "http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}",
    }),
  }),
  new ImageLayer({
    visible: false,
    properties: new LayerProperties({
      basemap: true,
      key: BasemapKey.Horby1960,
    }),
    source: new ImageArcGISRest({
      url: "https://maps.geoinfomittskane.se/arcgis/rest/services/sde_orto_DBO_Ortofoto_Hby_1960/ImageServer",
    }),
  }),
  new ImageLayer({
    visible: false,
    properties: new LayerProperties({
      basemap: true,
      key: BasemapKey.Horby1940,
    }),
    source: new ImageArcGISRest({
      url: "https://raster.unikom.se/arcgis/rest/services/Orto/Orto1940_1m_wgs84/ImageServer",
    }),
  }),
  new ImageLayer({
    visible: false,
    properties: new LayerProperties({
      basemap: true,
      key: BasemapKey.Horby1975,
    }),
    source: new ImageArcGISRest({
      url: "https://maps.geoinfomittskane.se/arcgis/rest/services/sde_orto_DBO_Ortofoto_Hby_1975/ImageServer",
    }),
  }),
  new ImageLayer({
    visible: false,
    properties: new LayerProperties({
      basemap: true,
      key: BasemapKey.Horby2017,
    }),
    source: new ImageArcGISRest({
      url: "https://raster.unikom.se/arcgis/rest/services/Orto/Orto2017_16cm_wgs84/ImageServer",
    }),
  }),
];
