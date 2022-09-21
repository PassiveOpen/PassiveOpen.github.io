import * as d3 from 'd3';
import { Floor } from '../components/enum.data';
import { BaseSVG } from './base.model';

export class AppPolygon extends BaseSVG {
  name = '';
  coords: [number, number][] = [];
  lineThickness = 1;

  constructor(data: Partial<AppPolygon>) {
    super();
    Object.assign(this, data);
  }

  async draw(floor: Floor) {
    if (this.svg === undefined) {
      this.svg = d3.select(`#${this.selector}`);
    }

    if (!this.show(floor)) {
      this.svg.attr('points', '');
      return;
    }

    this.svg
      .attr('points', this.coords.join(' '))
      .attr('stroke-width', this.meterPerPixel * this.lineThickness)
      .attr('transform', this.transform);
    this.setClass(this.svg);
  }
}
