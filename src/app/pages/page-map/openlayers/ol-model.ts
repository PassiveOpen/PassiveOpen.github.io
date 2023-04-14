import { Feature } from "ol";

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
  test = "Riksintressen",
  dem = "dem",
  heightLines = "heightLines",
  water = "water",
  roads = "roads",
  roadFills = "roadFills",
  building = "building",
  threes = "threes",
  kallmurar = "kallmurar",
}

export class LayerProperties {
  basemap: boolean = false;
  key: BasemapKey | LayerKey;
  name: string;
  visible: boolean;

  maptip: boolean = false;
  maptipCallback: (feature: Feature) => string;

  constructor(data: Partial<LayerProperties>) {
    Object.assign(this, data);
    if (!this.name) this.name = `${this.key}`;
  }
}
