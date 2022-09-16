import { xy } from '../house/house.model';

export const round = (decimals, number) => {
  return Math.round(number * 10 ** decimals) / 10 ** decimals;
};

export const sum = (a: any[], decimals = 3) => {
  return round(
    decimals,
    a.reduce((partialSum, v) => partialSum + v, 0)
  );
};

export const angleXY = (deg, r, offset = [0, 0], rnd = 3): xy => {
  const rad = (deg * Math.PI) / 180;
  const x = r * Math.cos(rad);
  const y = r * Math.sin(rad);
  return [round(rnd, x + offset[0]), round(rnd, y + offset[1])];
};

export const angleBetween = (p1, p2) => {
  return (Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180) / Math.PI;
};

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
export const lineIntersect = (line1, line2): xy => {
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

export const getDiagonal = (
  coord1: number[],
  coord2: number[],
  round = 2
): number => {
  const h = coord2[0] - coord1[0];
  const w = coord2[1] - coord1[1];
  return Math.round(Math.hypot(h, w) * 10 ** round) / 10 ** round;
};

export const offset = (coords: xy | number[], offset: xy | number[]): xy => {
  return [coords[0] + offset[0], coords[1] + offset[1]];
};

export const mixPoints = (
  coords1: xy | number[],
  coords2: xy | number[],
  flip = true
): xy => {
  if (flip) {
    return [coords1[0], coords2[1]];
  } else {
    return [coords2[0], coords1[1]];
  }
};

String.prototype.toTitleCase = function (): string {
  return this.replace(/\b\w/g, (first) => first.toLocaleUpperCase());
};
