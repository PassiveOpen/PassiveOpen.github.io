import { House } from '../../house/house.model';
import * as d3 from 'd3';
import { Floor } from '../../components/enum.data';

export class Figure {
  coords: number[][] = [[], []];
  svg: d3.Selection<SVGGElement, unknown, HTMLElement, undefined>;
  classes;
  constructor(classes, update) {
    this.update = update;
  }

  update: (house: House) => void;

  async draw(selector: string, floor: Floor, meterPerPixel: number) {
    if (this.svg === undefined) {
      if(!this.visible(floor)) return 
      this.svg = d3.select(selector).append('polygon');
      this.svg.attr('id', selector.replace(/[\.#]/gi, ''));
    }

    this.svg
      .attr('points', this.coords.join(' '))
      .attr('classes', this.classes);
  }
}
