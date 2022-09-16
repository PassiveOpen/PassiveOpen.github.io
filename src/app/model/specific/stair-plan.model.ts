import * as d3 from 'd3';
import { Floor } from 'src/app/components/enum.data';
import { Stair } from 'src/app/house/stairs.model';
import { angleBetween, angleXY } from 'src/app/shared/global-functions';
import { BaseSVG } from '../base.model';

export class AppStairPlan extends BaseSVG {
  floor = Floor.all;
  name = 'step';
  parent: Stair;
  last = false;
  visible = true;
  fontSize = 10;
  svgText: d3.Selection<SVGTextElement, unknown, HTMLElement, any>;
  svgStep: d3.Selection<SVGPolygonElement, unknown, HTMLElement, any>;
  svgRise: d3.Selection<SVGPolylineElement, unknown, HTMLElement, any>;
  walkLineXY = [0, 0];
  nextWalkLineXY = [0, 0];
  stringerXY = [0, 0];
  nextStingerXY = [0, 0];
  lineThickness = 0.3;

  constructor(data: Partial<AppStairPlan>) {
    super();
    Object.assign(this, data);
  }

  async draw(floor: Floor) {
    if (this.svg === undefined) {
      this.svg = d3.select(`#${this.selector}`);

      this.svgText = this.svg.select('.step-plan-text');
      this.svgRise = this.svg.select('.step-plan-rise');
      this.svgStep = this.svg.select('.step-plan-lines');

      if (this.last) {
        this.classes.push('last');
      }
    }

    const direction = angleBetween(this.walkLineXY, this.nextWalkLineXY);
    const textXY = angleXY(
      direction - 45,
      this.parent.run * 0.8,
      this.walkLineXY
    );

    const riseDeg = angleBetween(this.stringerXY, this.walkLineXY);
    const nextRiseDeg = angleBetween(this.nextStingerXY, this.nextWalkLineXY);
    const outerStinger = angleXY(riseDeg, 1, this.walkLineXY);
    const nextOuterStinger = angleXY(nextRiseDeg, 1, this.nextWalkLineXY);

    this.svgStep
      .attr('stroke-width', this.meterPerPixel * this.lineThickness)
      .attr(
        'points',
        [
          this.walkLineXY,
          this.stringerXY,
          this.nextStingerXY,
          this.nextWalkLineXY,
          nextOuterStinger,
          outerStinger,
        ].join(' ')
      );

    angleXY;
    this.svgRise
      .attr('stroke-width', this.meterPerPixel * this.lineThickness * 1)
      .attr(
        'points',
        [
          angleXY(riseDeg + 90, this.parent.nose, outerStinger),
          angleXY(riseDeg + 90, this.parent.nose, this.stringerXY),
        ].join(' ')
      );

    this.svgText
      .attr('font-size', this.fontSize * this.meterPerPixel)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('transform', `translate(${textXY[0]}, ${textXY[1]})`)
      .text(this.index);

    // this.svg.attr(
    //   'transform',
    //   `translate(${this.walkLineXY[0]}, ${this.walkLineXY[1]})`
    // );
    this.setClass(this.svg);
  }
}
