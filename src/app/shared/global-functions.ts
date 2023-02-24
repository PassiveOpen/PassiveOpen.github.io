import { Axis } from "../components/enum.data";
import { xy } from "../house/house.model";
import * as THREE from "three";

export const phi = 1.61803398874989;

export const round = (number: number, decimals = 4) => {
  return Math.round(number * 10 ** decimals) / 10 ** decimals;
};

/**
 * Get the center between two points
 * @param coord1
 * @param point2
 * @param offset offset a ratio
 * @returns
 */
export const centerBetweenPoints = ([x, y]: xy, [v, w]: xy, offset = 1): xy => {
  return [(v - x) / (2 / offset) + x, (w - y) / (2 / offset) + y];
};

export const sum = (a: any[], decimals = 4) => {
  return round(
    a.reduce((partialSum, v) => partialSum + v, 0),
    decimals
  );
};

export const angleXY = (deg, r, offset: xy = [0, 0], decimals = 4): xy => {
  const rad = (deg * Math.PI) / 180;
  const x = r * Math.cos(rad);
  const y = r * Math.sin(rad);
  return [round(x + offset[0], decimals), round(y + offset[1], decimals)];
};

/**
 * angle in Deg between two points
 */
export const angleBetween = (p1: xy, p2: xy, decimals = 3) => {
  return round(
    (Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180) / Math.PI,
    decimals
  );
};
export function angles3D(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  decimals = 3
): [number, number] {
  // Calculate vertical angle
  const verticalAngle = Math.atan2(
    p2.y - p1.y,
    Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.z - p1.z, 2))
  );
  const verticalAngleDegrees = verticalAngle * (180 / Math.PI);

  // Calculate horizontal angle
  const horizontalAngle = Math.atan2(p2.x - p1.x, p2.z - p1.z);
  let horizontalAngleDegrees = horizontalAngle * (180 / Math.PI);

  if (horizontalAngleDegrees < 0) {
    horizontalAngleDegrees = 360 + horizontalAngleDegrees;
  }

  return [
    round(-verticalAngleDegrees, decimals),
    round(horizontalAngleDegrees, decimals),
  ];
}
export const findCircleLineIntersections = (r, m, n, h = 0, k = 0) => {
  // circle: (x - h)^2 + (y - k)^2 = r^2
  // line: y = m * x + n
  // r: circle radius
  // h: x value of circle centre
  // k: y value of circle centre
  // m: slope
  // n: y-intercept

  const sq = (x) => x * x;
  const sqrt = (x) => Math.sqrt(x);

  // get a, b, c values
  var a = 1 + sq(m);
  var b = -h * 2 + m * (n - k) * 2;
  var c = sq(h) + sq(n - k) - sq(r);

  // get discriminant
  var d = sq(b) - 4 * a * c;
  // insert into quadratic formula
  var intersections = [
    (-b + sqrt(sq(b) - 4 * a * c)) / (2 * a),
    (-b - sqrt(sq(b) - 4 * a * c)) / (2 * a),
  ];
  const x = intersections[1];
  return [x, m * x + n];
};
export const lineIntersect = (line1: xy[], line2: xy[]): xy => {
  const [[x1, y1], [x2, y2]] = line1;
  const [[x3, y3], [x4, y4]] = line2;
  var ua,
    ub,
    denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

  if (denom == 0) {
    return null;
  }
  ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
  return [x1 + ua * (x2 - x1), y1 + ua * (y2 - y1)];
};

export const multiLineIntersect = (multiLine: xy[], line2: xy[]): xy[] => {
  const intersections: xy[] = [];
  const j = multiLine.length;
  for (let i = 0; i < j - 1; i++) {
    const subLine = [multiLine[i], multiLine[i + 1]];
    const xy = lineIntersect(subLine, line2);
    if (xy) intersections.push(lineIntersect(subLine, line2));
  }
  return intersections;
};
export const distanceBetweenPoints = (
  coord1: xy,
  coord2: xy,
  decimals = 4
): number => {
  if (!coord1 || !coord2) return 0;
  const h = coord2[0] - coord1[0];
  const w = coord2[1] - coord1[1];
  return round(Math.hypot(h, w), decimals);
};

export const offset = (coords: xy, offset: xy): xy => {
  return [coords[0] + offset[0], coords[1] + offset[1]];
};

export const mixPoints = (coords1: xy, coords2: xy, flip = true): xy => {
  if (flip) {
    return [coords1[0], coords2[1]];
  } else {
    return [coords2[0], coords1[1]];
  }
};
export const ptToScale = (
  pt: number,
  meterPerPixel: number,
  print: boolean = false
): number => {
  let mm;
  if (print) {
    mm = (pt * 0.3528) / 10;
  } else {
    mm = pt * meterPerPixel;
  }
  return round(mm, 3);
};

String.prototype.toTitleCase = function (): string {
  return this.replace(/\b\w/g, (first) => first.toLocaleUpperCase());
};
export function toDegrees(angle) {
  return angle * (180 / Math.PI);
}
export function toRadians(angle) {
  return angle * (Math.PI / 180);
}

//** get axis */
export const getAxis = (axis: Axis): THREE.Vector3 => {
  switch (axis) {
    case Axis.x:
      return new THREE.Vector3(1, 0, 0);
    case Axis.y:
      return new THREE.Vector3(0, 1, 0);
    case Axis.z:
      return new THREE.Vector3(0, 0, 1);
    case Axis.red:
      return new THREE.Vector3(1, 0, 0);
    case Axis.green:
      return new THREE.Vector3(0, 1, 0);
    case Axis.blue:
      return new THREE.Vector3(0, 0, 1);
  }
};
