import { SafeHtml } from '@angular/platform-browser';
import * as d3 from 'd3';
import { House } from '../../house/house.model';
import { Cross } from '../../house/cross.model';
import { Wall } from './wall.model';
import { BaseSVG } from '../base.model';
import { angleXY, round } from '../../shared/global-functions';
import { Floor } from '../../components/enum.data';

export class Measure extends BaseSVG {
  svgLine: d3.Selection<SVGPolylineElement, unknown, HTMLElement, any>;
  svgText: d3.Selection<SVGTextElement, unknown, HTMLElement, any>;
  svgArrow1: d3.Selection<SVGTextElement, unknown, HTMLElement, any>;
  svgArrow2: d3.Selection<SVGTextElement, unknown, HTMLElement, any>;

  textRotate = 0;
  fontSize = 14;
  a = [0, 0];
  b = [4, 4];
  offsetPixels = 0;
  offsetMeters = 0;
  direction = 90;
  lineThickness = 0.6;

  decimals = 1;
  classes = ['measure'];
  visible = false;

  constructor(data: Partial<Measure>) {
    super();
    Object.assign(this, data);
  }

  between(a, b) {
    return [a[0] + (b[0] - a[0]) / 2, a[1] + (b[1] - a[1]) / 2];
  }
  async draw(floor: Floor) {
    if (this.svg === undefined) {
      if (!this.show(floor)) return;
      this.svg = d3.select(`#${this.selector}`);

      this.setClass(this.svg);
      this.svgLine = this.svg.append('polyline');
      this.svgArrow1 = this.svg.append('text');
      this.svgArrow2 = this.svg.append('text');
      this.svgText = this.svg.append('text');
    }

    if (!this.show(floor)) {
      this.svgLine.attr('points', '');
      this.svgText.text('');
      this.svgArrow1.text('');
      this.svgArrow2.text('');
      return;
    }
    let a = [...this.a];
    let b = [...this.b];
    let textOffset = [0, 0];
    if (this.direction === 90) {
      a = [a[0], Math.max(a[1], b[1])];
      b = [b[0], Math.max(a[1], b[1])];
    }
    if (this.direction === -90) {
      a = [a[0], Math.min(a[1], b[1])];
      b = [b[0], Math.min(a[1], b[1])];
    }
    if (this.direction === 0) {
      a = [Math.max(a[0], b[0]), a[1]];
      b = [Math.max(a[0], b[0]), b[1]];
    }
    if (this.direction === 180) {
      a = [Math.min(a[0], b[0]), a[1]];
      b = [Math.min(a[0], b[0]), b[1]];
    }
    const pixels = this.offsetPixels * this.meterPerPixel;

    const aX = angleXY(this.direction, pixels + this.offsetMeters, a);
    const bX = angleXY(this.direction, pixels + this.offsetMeters, b);
    const arrowSize = 0.3;
    const textOrigin = this.between(aX, bX);
    var aa = bX[0] - aX[0];
    var bb = bX[1] - aX[1];
    var lengthMeters = round(this.decimals, Math.sqrt(aa * aa + bb * bb));

    if (lengthMeters === 0) {
      this.svg.style('visibility', 'hidden');
    } else {
      this.svg.style('visibility', '');
    }

    this.svgLine
      .attr('points', [this.a, a, aX, bX, b, this.b].join(' '))
      .attr('stroke-width', this.meterPerPixel * this.lineThickness);

    this.svgText
      .attr('font-size', this.meterPerPixel * this.fontSize)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('stroke-width', this.meterPerPixel * 6)
      .attr(
        'transform',
        `
        translate(${textOrigin[0] + textOffset[0]} ${
          textOrigin[1] + textOffset[1]
        }) 
        rotate(${this.textRotate})
        `
      )
      .text(lengthMeters);

    let arrowCorrection = 90;
    if ([90, 0].includes(this.direction)) {
      arrowCorrection = -90;
    }

    this.svgArrow1
      .attr('font-size', this.meterPerPixel * 16)
      .attr('text-anchor', 'start')
      .attr('dominant-baseline', 'central')
      .attr('stroke-width', 0)
      .attr(
        'transform',
        `
        translate(${aX[0]} ${aX[1]}) 
        rotate(${this.direction + arrowCorrection})
        `
      )
      .text('<');
    this.svgArrow2
      .attr('font-size', this.meterPerPixel * 16)
      .attr('text-anchor', 'start')
      .attr('dominant-baseline', 'central')
      .attr('stroke-width', 0)
      .attr(
        'transform',
        `
          translate(${bX[0]} ${bX[1]}) 
          rotate(${this.direction + arrowCorrection + 180})
          `
      )
      .text('<');
  }
}
