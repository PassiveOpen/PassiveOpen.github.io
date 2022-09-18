import { SafeHtml } from '@angular/platform-browser';
import * as d3 from 'd3';
import { House, xy } from '../../house/house.model';
import { Floor } from '../../components/enum.data';
import { BaseSVG } from '../base.model';
import { offset, round } from 'src/app/shared/global-functions';
export class Room extends BaseSVG {
  coords: xy[] = [];
  floor = Floor.ground;
  parent: House;
  hole = false;
  centralElectricity: xy = [0, 0];
  theoretic = false;

  northWestCorner: xy;
  width = 0;
  height = 0;

  constructor(data: Partial<Room>) {
    super();
    Object.assign(this, data);
  }
  setup(): void {}

  async draw(floor: Floor) {
    if (this.svg === undefined) {
      this.svg = d3.select(`#${this.selector}`);
      if (!this.name) this.name = this.selector;
      this.classes = [`floor-${this.floor}`];
      if (this.hole) {
        this.classes.push('room-hole');
        this.svg.attr('filter', 'url(#inset-shadow)');
      }
      this.classes.push('bg-fill');
    }

    if (!this.show(floor)) {
      this.svg.attr('points', '');
      return;
    }
    this.svg.attr('points', this.coords.join(' '));
    this.setClass(this.svg);
  }

  tooltip = (): SafeHtml => {
    console.log(this.selector);

    let str = `Room <b>${this.name}</b> 
    <br>${this.floor}-level
    <br>${this.area()}m2`;

    if (this.width) str += `<br>width: ${this.width}m`;
    if (this.height) str += `<br>height: ${this.height}m`;

    return str;
  };

  area = () => {
    if (this.coords.length === 0 || this.hole) {
      return 0;
    }
    return Math.abs(Math.round(d3.polygonArea(this.coords) * 1e1) / 1e1);
  };
  volume = () => {
    // todo
    if (this.floor === Floor.top || this.hole) {
      return this.area() * this.parent.cross.ceilingHeight;
    }
    if (this.floor === Floor.ground || this.hole) {
      return this.area() * this.parent.cross.ceilingHeight;
    }
  };

  squaredRoom = (width, height) => {
    this.width = round(3, width);
    this.height = round(3, height);
    this.coords = [
      this.northWestCorner,
      offset(this.northWestCorner, [width, 0]),
      offset(this.northWestCorner, [width, height]),
      offset(this.northWestCorner, [0, height]),
    ];

    this.center = offset(this.northWestCorner, [width / 2, height / 2]);
    this.centralElectricity = this.center;
  };
}
