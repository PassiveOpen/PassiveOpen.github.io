export enum BasemapKey {
  OSM = "OSM",
  Google = "Google",
  OSMSatellite = "OSMSatellite",
  GoogleSatellite = "GoogleSatellite",
  Horby1960 = "Horby1960",
  Horby1975 = "Horby1975",
}

export enum LayerKey {
  House = "House",
  parcel = "parcel",
  test = "Riksintressen",
  dem = "dem",
}

export class LayerProperties {
  basemap: boolean = false;
  key: BasemapKey | LayerKey;
  name: string;
  visible: boolean;

  constructor(data: Partial<LayerProperties>) {
    Object.assign(this, data);
    if (!this.name) this.name = `${this.key}`;
  }
}
