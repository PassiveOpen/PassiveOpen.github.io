import { Injectable } from "@angular/core";
import GeoJSON from "ol/format/GeoJSON.js";
import { centerOfMass, dissolve, featureCollection, polygon } from "@turf/turf";
import { Coordinate } from "ol/coordinate";
import { Point, Polygon } from "ol/geom";

@Injectable({
  providedIn: "root",
})
export class TurfService {
  getCenterOfMass(coords: Coordinate[]): Point {
    const geojson = new GeoJSON();
    const turfed = centerOfMass(polygon([coords]));
    const point = geojson.readFeatures(turfed)[0].getGeometry() as Point;
    return point;
  }

  coordsDissolveToPolygon(coords: Coordinate[]): Polygon {
    const geojson = new GeoJSON();
    const collection = featureCollection([polygon([coords])]);
    var turfed = dissolve(collection);
    const geom = geojson.readFeatures(turfed)[0].getGeometry() as Polygon;
    return geom;
  }
}
