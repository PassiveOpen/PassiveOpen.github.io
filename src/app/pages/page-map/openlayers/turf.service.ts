import { Injectable } from "@angular/core";
import GeoJSON from "ol/format/GeoJSON.js";
import {
  centerOfMass,
  concave,
  dissolve,
  distance,
  feature,
  featureCollection,
  lineIntersect,
  lineString,
  nearestPointOnLine,
  point,
  polygon,
} from "@turf/turf";
import { Coordinate } from "ol/coordinate";
import { LineString, Point, Polygon } from "ol/geom";
import { distanceBetweenPoints, round } from "src/app/shared/global-functions";
import { xy } from "src/app/house/house.model";

@Injectable({
  providedIn: "root",
})
export class TurfService {
  hull(coords: Coordinate[]) {
    const geojson = new GeoJSON();
    const collection = featureCollection(coords.map((x) => point(x)));
    const turfed = concave(collection);
    const hull = geojson.readFeatures(turfed)[0].getGeometry() as Polygon;
    return hull;
  }
  getCenterOfMass(coords: Coordinate[]): Point {
    const geojson = new GeoJSON();
    const turfed = centerOfMass(polygon([coords]));
    const point = geojson.readFeatures(turfed)[0].getGeometry() as Point;
    return point;
  }
  lineIntersect(line1s: LineString, line2s: LineString) {
    const geojson = new GeoJSON();
    const line1 = lineString(line1s.getCoordinates());
    const line2 = lineString(line2s.getCoordinates());
    const turfed = lineIntersect(line1, line2);
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

  pointToLineDistance(point: Coordinate, line: Coordinate[]) {
    const geojson = new GeoJSON();
    const lineFeature = feature({
      type: "LineString",
      coordinates: line,
    });
    const pointFeature = feature({
      type: "Point",
      coordinates: point,
    });
    // @ts-ignore
    const turfed = nearestPointOnLine(lineFeature, pointFeature);
    return geojson.readFeatures(turfed)[0].getGeometry() as Point;
  }

  closestPointBetweenPointsAndPolygon(points: Point[], polygon: Polygon) {
    const all = points.map((point, i) => {
      const p = point.getCoordinates();
      const linePoint = polygon.getClosestPoint(p);

      const dist = round(distanceBetweenPoints(linePoint as xy, p as xy), 0);
      return {
        housePoint: p,
        linePoint,
        dist,
        i,
      };
    });
    const closest = all.sort((a, b) => a.dist - b.dist)[0];
    return closest;
  }

  closestPointBetweenLineAndPolygon(line: LineString, polygon: Polygon) {
    const all = polygon.getCoordinates()[0].map((housePoint, i) => {
      const linePoint = line.getClosestPoint(housePoint);
      const dist = round(
        distanceBetweenPoints(linePoint as xy, housePoint as xy),
        0
      );
      return {
        housePoint,
        linePoint,
        dist,
        i,
      };
    });
    const closest = all.sort((a, b) => a.dist - b.dist)[0];
    return closest;
  }
}
