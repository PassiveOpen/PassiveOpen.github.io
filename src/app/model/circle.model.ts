import * as d3 from 'd3';
import { Floor } from '../components/enum.data';
import { BaseSVG } from './base.model';

export class AppCircle extends BaseSVG {
  name = '';
  cx = 0;
  cy = 0;
  r = 1;
  _lineThickness = 0.2;

  constructor(data: Partial<AppCircle>) {
    super();
    Object.assign(this, data);
  }

  async draw(floor: Floor) {
    if (this.svg === undefined) {
      if (!this.show(floor)) return;
      this.svg = d3.select(`#${this.selector}`);
    }

    this.svg
      .attr('cx', this.cx)
      .attr('cy', this.cy)
      .attr('r', this.r)
      .attr('stroke-width', this.meterPerPixel * this.lineThickness)
      .attr('transform', this.transform);
    this.setClass(this.svg);
  }
}
