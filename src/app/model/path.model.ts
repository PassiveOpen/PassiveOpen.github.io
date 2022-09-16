import { Cross } from '../house/cross.model';
import { House } from '../house/house.model';
import * as d3 from 'd3';
import { BaseSVG } from './base.model';
import { Floor } from '../components/enum.data';

export class AppPath extends BaseSVG {
  d: string = '';

  constructor(data: Partial<AppPath>) {
    super();
    Object.assign(this, data);
  }

  async draw(floor: Floor) {
    if (this.svg === undefined) {
      if (!this.show(floor)) return;
      this.svg = d3.select(`#${this.selector}`);
    }
    this.svg
      .attr('d', this.d)
      .attr('stroke-width', this.meterPerPixel * this.lineThickness)
      .attr('transform', this.transform);
    this.setClass(this.svg);
  }
  setClass(svg) {
    if (!svg.node() || this.classes.length === 0) {
      return;
    }
    svg.node().classList.add(this.classes);
  }
}
