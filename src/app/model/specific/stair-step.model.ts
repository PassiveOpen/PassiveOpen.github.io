import * as d3 from 'd3';
import { Floor } from 'src/app/components/enum.data';
import { Stair } from 'src/app/house/stairs.model';
import { BaseSVG } from '../base.model';

export class AppStair extends BaseSVG {
  svgRun: d3.Selection<SVGPolygonElement, unknown, HTMLElement, any>;
  svgRise: d3.Selection<SVGPolygonElement, unknown, HTMLElement, any>;
  svgText: d3.Selection<SVGTextElement, unknown, HTMLElement, any>;
  parent: Stair;
  last = false;
  visible = true;
  fontSize = 14;

  constructor(data: Partial<AppStair>) {
    super();
    Object.assign(this, data);
  }

  async draw(floor: Floor) {
    if (this.svg === undefined) {
      this.svg = d3.select(`#${this.selector}`);

      this.svgRun = this.svg.select<SVGPolylineElement>('.step-run');
      this.svgRise = this.svg.select<SVGPolylineElement>('.step-rise');
      this.svgText = this.svg.select<SVGTextElement>('.step-text');
      if (this.last) {
        this.classes.push('last');
      }
    }

    if (this.show) {
      this.svg.style('display', '');
    } else {
      this.svg.style('display', 'none');
    }

    this.svg.attr(
      'transform',
      `translate(${this.index * this.parent.run}, ${
        -this.index * this.parent.rise
      })`
    );
    this.setClass(this.svg);

    this.svgRun
      .attr('stroke-width', this.meterPerPixel * this.lineThickness)
      .attr(
        'points',
        [
          [0, 0],
          [0, this.parent.runThickness],
          [
            this.last
              ? this.parent.nose
              : this.parent.run + this.parent.riseThickness + this.parent.nose,
            this.parent.runThickness,
          ],
          [
            this.last
              ? this.parent.nose
              : this.parent.run + this.parent.riseThickness + this.parent.nose,
            0,
          ],
        ].join(' ')
      );
    this.svgRise
      .attr('stroke-width', this.meterPerPixel * this.lineThickness)
      .attr(
        'points',
        [
          [this.parent.nose, this.parent.runThickness],
          [this.parent.nose, this.parent.rise],
          [this.parent.nose + this.parent.riseThickness, this.parent.rise],
          [
            this.parent.nose + this.parent.riseThickness,
            this.parent.runThickness,
          ],
        ].join(' ')
      );

    this.svgText
      .attr('font-size', this.fontSize * this.meterPerPixel)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('stroke-width', 6 * this.meterPerPixel)
      .attr(
        'transform',
        `
        translate(${this.parent.run / 2} ${-this.meterPerPixel * 16}) 
        `
      )
      .text(this.index);
  }
}
