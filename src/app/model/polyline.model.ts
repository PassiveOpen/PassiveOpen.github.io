import { Cross } from '../house/cross.model';
import { House, xy } from '../house/house.model';
import * as d3 from 'd3';
import { BaseSVG } from './base.model';
import { Floor } from '../components/enum.data';

export class AppPolyline extends BaseSVG {
  points: xy[] = [];
  dash: number[] = [];

  constructor(data: Partial<AppPolyline>) {
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
      .attr('points', this.points.join(' '))
      .attr('stroke-width', this.meterPerPixel * this.lineThickness)
      .attr('transform', this.transform);

    this.svg.attr(
      'stroke-dasharray',
      this.dash
        .map((x) => x * this.meterPerPixel * this.lineThickness)
        .join(' ')
      // `${this.meterPerPixel * this.lineThickness * 10 * 0.5} ${
      //   this.meterPerPixel * this.lineThickness * 10
      // }`
    );
    this.setClass(this.svg);
  }
}
