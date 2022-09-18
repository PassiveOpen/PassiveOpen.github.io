import { House, xy } from '../../house/house.model';
import * as d3 from 'd3';
import { Door } from './door.model';
import { Room } from './room.model';
import { BaseSVG } from '../base.model';
import { Floor } from '../../components/enum.data';
import { SafeHtml } from '@angular/platform-browser';
import {
  angleBetween,
  angleXY,
  getDiagonal,
  offset,
  round,
} from 'src/app/shared/global-functions';
import { Footprint } from './footprint';

let ids = {};

export enum WallType {
  outer = 'outer',
  inner = 'inner',
  theoretic = 'theoretic',
}
export enum WallSide {
  in = 'in',
  out = 'out',
  left = 'left',
  right = 'right',
}

export enum CornerType {
  inside = 'inside',
  outside = 'outside',
  tower = 'tower',
  straight = 'straight',
}
type Sides = {
  [key in WallSide]?: [number, number][];
};
type svgSides = {
  [key in WallSide]?: d3.Selection<
    SVGPolylineElement,
    unknown,
    HTMLElement,
    any
  >;
};

export class Wall extends BaseSVG {
  type: WallType;
  sides: Sides;
  svgRight: d3.Selection<SVGPolylineElement, unknown, HTMLElement, any>;
  svgLeft: d3.Selection<SVGPolylineElement, unknown, HTMLElement, any>;
  svgFill: d3.Selection<SVGPolygonElement, unknown, HTMLElement, any>;
  svgOrigin: d3.Selection<SVGCircleElement, unknown, HTMLElement, any>;
  thickness: number;
  parent: Room;
  origin: [number, number] = [0, 0];
  innerWallLength: number;
  outerWallLength: number;
  orientation = '';
  ceiling: number = -1;
  gable = false;

  constructor(data: Partial<Wall>) {
    super();
    Object.assign(this, data);
  }

  createSelector() {
    this.selector = this.parent.selector.replace('Footprint-1', 'outer');
    const angle = angleBetween(
      this.sides[WallSide.in][0],
      this.sides[WallSide.in][1]
    );

    if (angle === 90 * 0) {
      this.orientation = `North`;
    } else if (angle === 45) {
      this.orientation = `NortEast`;
    } else if (angle === -45 || angle === 360 - 45) {
      this.orientation = `NorthWest`;
    } else if (angle === 90 * 1) {
      this.orientation = `East`;
    } else if (angle === 90 * 2) {
      this.orientation = `South`;
    } else if (angle === 90 * 3 || angle === -90) {
      this.orientation = `West`;
    } else {
      this.orientation = `${angle}`.split('.')[0];
    }
    this.selector += `-${this.orientation}Wall`;

    if (!(this.selector in ids)) {
      ids[this.selector] = 0;
    }
    ids[this.selector]++;
    if (ids[this.selector] > 1) {
      this.selector += `-${ids[this.selector]}`;
    }
  }

  async draw(floor: Floor) {
    if (this.svg === undefined) {
      this.svg = d3.select(`#${this.selector}`);
      // if (this.type === WallType.theoretic) this.theoretic = true;

      this.svgOrigin = this.svg.select<SVGCircleElement>('.wall-origin');
      this.svgLeft = this.svg.select<SVGPolylineElement>('.wall-left');
      this.svgRight = this.svg.select<SVGPolylineElement>('.wall-right');
      this.svgFill = this.svg.select<SVGPolygonElement>('.wall-fill');

      if (this.type === WallType.outer) {
        this.thickness = this.parent.parent.wallOuterThickness;
      }
      if (this.type === WallType.inner) {
        this.thickness = this.parent.parent.wallInnerThickness;
      }

      if (this.svg.node()) {
        this.svg.node().classList.add(`type-${this.type}`);
      }
    }
    if (!this.show(floor)) {
      this.svgFill.attr('points', '');
      this.svgLeft.attr('points', '');
      this.svgRight.attr('points', '');
      this.svgOrigin.attr('r', '0');

      return;
    }

    // Extr's
    this.svgOrigin
      .attr('cx', this.origin[0])
      .attr('cy', this.origin[1])
      .attr('r', this.meterPerPixel * this.lineThickness * 3);

    if (this.sides.in && this.sides.out) {
      this.svgFill.attr(
        'points',
        [...this.sides.in, ...[...this.sides.out].reverse()].join(' ')
      );
    }

    for (let wallSide of Object.keys(WallSide)) {
      const side = wallSide as WallSide;
      if (!(side in this.sides)) {
        return;
      }
      let lineSVG: d3.Selection<SVGPolygonElement, unknown, HTMLElement, any>;
      if (side === WallSide.in) {
        lineSVG = this.svgLeft;
      } else {
        lineSVG = this.svgRight;
      }

      lineSVG
        .attr(
          'stroke-width',
          this.meterPerPixel *
            this.lineThickness *
            (this.type === WallType.theoretic ? 4 : 1) // DEV
        )
        .attr('points', this.sides[side].join(' '));
      if (lineSVG.node()) {
        lineSVG.node().classList.add(`side-${side}`);
      }
    }
    this.innerWallLength = this.getLength(WallSide.in);
    this.outerWallLength = this.getLength(WallSide.out);
  }

  getLength(side: WallSide, decimals = 2) {
    const arr = this.sides[side];
    if (!arr || !arr[0] || !arr[1]) return 0;
    return round(
      decimals,
      getDiagonal(...(arr as [[number, number], [number, number]]))
    );
  }

  getArea(side: WallSide, decimals = 2) {
    const l = this.getLength(side);
    if (l === 0) return 0;
    if (this.gable) {
      // todo, calc gables
      return round(decimals, l * this.ceiling);
    } else {
      return round(decimals, l * this.ceiling);
    }
  }

  getPosition(side: WallSide, ratio, offset = 0): xy {
    const arr = this.sides[side];
    const distance = this.getLength(side) * ratio;
    const angle = angleBetween(arr[0], arr[1]);
    return angleXY(angle, distance + offset, arr[0]);
  }

  tooltip = (): SafeHtml => {
    return `Wall <b>${this.orientation}</b> (${
      this.parent instanceof Footprint ? 'outer wall' : 'of ' + this.parent + ' room'
    } ) 
    <br>Inside ${this.getLength(WallSide.in, 2)} m2
    <br>Outside ${(this.outerWallLength = this.getLength(WallSide.out, 2))} m2`;
  };

  drawTheoretic(orientation: 'w' | 'n' | 'e' | 's', house, thickness) {
    this.thickness = thickness;
    if (orientation === 'n') {
      this.drawByRoom(0, 1, house, CornerType.straight, CornerType.straight);
    }
    if (orientation === 'e') {
      this.drawByRoom(1, 2, house, CornerType.straight, CornerType.straight);
    }
    if (orientation === 's') {
      this.drawByRoom(2, 3, house, CornerType.straight, CornerType.straight);
    }
    if (orientation === 'w') {
      this.drawByRoom(3, 0, house, CornerType.straight, CornerType.straight);
    }
  }

  drawByRoom(
    i,
    j,
    house: House,
    firstCorner: CornerType,
    secondCorner: CornerType
  ) {
    if (this.visible === false) {
      this.sides = {
        [WallSide.in]: [
          [0, 0],
          [0, 0],
        ],
        [WallSide.out]: [
          [0, 0],
          [0, 0],
        ],
      };
      return;
    }
    if (this.type === WallType.inner) {
      this.thickness = house.wallInnerThickness;
      this.ceiling = house.cross.ceilingHeight;
    } else if (this.type === WallType.outer) {
      this.thickness = house.wallOuterThickness;
      this.ceiling = house.cross.outerWallHeight;
    } else if (this.type === WallType.theoretic) {
      this.ceiling = house.cross.ceilingHeight;
    } else {
      console.error(this);
    }

    const getAngle = (ii, type: CornerType, angle) => {
      if (type === CornerType.inside && ii === 0) return angle + 45;
      if (type === CornerType.inside && ii === 1) return angle - 45;
      if (type === CornerType.outside && ii === 0) return angle - 45;
      if (type === CornerType.outside && ii === 1) return angle + 45;
      if (type === CornerType.tower && ii === 0) return angle + (45 + 45 / 2);
      if (type === CornerType.tower && ii === 1) return angle - (45 + 45 / 2);
      if (type === CornerType.straight) return angle;
    };
    const getDistance = (cornerType: CornerType) => {
      const dio = Math.sqrt(this.thickness ** 2 * 2);
      const t = house.tower;

      if (cornerType === CornerType.inside) return dio;
      if (cornerType === CornerType.outside) return dio;
      if (cornerType === CornerType.tower)
        return getDiagonal(t.innerCoords[0], t.outerCoords[7]);
      if (cornerType === CornerType.straight) return this.thickness;
    };

    let first = this.parent.coords[i];
    let second = this.parent.coords[j];

    this.origin = first;
    this.innerWallLength = getDiagonal(first, second);
    let angle = angleBetween(first, second) - 90;

    this.sides = {
      [WallSide.in]: [first, second],
    };

    if (this.type !== WallType.theoretic) {
      this.sides[WallSide.out] = [
        angleXY(
          getAngle(0, firstCorner, angle),
          getDistance(firstCorner),
          first
        ),
        angleXY(
          getAngle(1, secondCorner, angle),
          getDistance(secondCorner),
          second
        ),
      ];
    }
  }
}
