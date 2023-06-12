import { Feature } from "ol";
import BaseLayer from "ol/layer/Base";

export enum BasemapKey {
  OSM = "OSM",
  Google = "Google",
  OSMSatellite = "OSMSatellite",
  GoogleSatellite = "GoogleSatellite",
  Horby1940 = "Horby1940",
  Horby1960 = "Horby1960",
  Horby1975 = "Horby1975",
  Horby2017 = "Horby2021",
  none = "none",
}

export enum LayerKey {
  House = "House",
  parcel = "parcel",
  parcelBorders = "parcelBorders",
  test = "test",
  dem = "dem",
  dem2 = "dem2",
  heightLines = "heightLines",
  water = "water",
  waterArea = "waterArea",
  roads = "roads",
  roadFills = "roadFills",
  building = "building",
  threes = "threes",
  distanceLines = "distanceLines",
  kallmurar = "kallmurar",
  shadow = "shadow",
}

export class LayerProperties {
  basemap: boolean = false;
  key: BasemapKey | LayerKey;
  name: string;
  visible: boolean;

  maptip: boolean = false;
  maptipCallback: (x: any) => string;

  constructor(data: Partial<LayerProperties>) {
    Object.assign(this, data);
    if (!this.name) this.name = `${this.key}`;
  }
}
