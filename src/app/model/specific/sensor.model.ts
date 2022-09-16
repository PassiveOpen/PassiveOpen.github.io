import * as d3 from 'd3';
import { BaseSVG } from '../base.model';
import { CableType, Floor, SensorType } from '../../components/enum.data';
import { Wall, WallSide } from './wall.model';
import { Room } from './room.model';
import { SafeHtml } from '@angular/platform-browser';
import { angleBetween, angleXY, round } from 'src/app/shared/global-functions';

export class Sensor<T> extends BaseSVG {
  name;
  parent: T;
  points: [number, number][] | number[][] = [];
  sensorType: SensorType;
  svgIcon: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  offset = [0, 0];
  offsetWall = 0.3;
  elevation = 0.3;
  group: number;
  verticalCableLength = 0;
  via: Floor;
  cableOnly = false;
  sensorOnly = false;
  wallSide = WallSide.in;
  cableLength = 0;
  amount = 1;
  floor: Floor = Floor.ground;
  fontSize = 14;
  visible = false;

  cableType: CableType;

  constructor(data: Partial<Sensor<T>>) {
    super();
    Object.assign(this, data);
  }

  async getSVG() {
    const r = await fetch(`assets/svg/${this.sensorType}.svg`);
    return (await r.text()).replace(/id=\"\w+-?\w*\"/gi, '');
  }

  async draw(floor: Floor) {
    if (this.svg === undefined) {
      if (!this.show(floor)) return;
      this.svg = d3.select(`#${this.selector}.sensor-cable`);

      if (this.sensorType === SensorType.temperature) {
        this.sensorOnly = true;
      }

      if (!this.cableOnly) {
        // So it has a Icon
        this.svgIcon = d3.select(`#${this.selector}.sensor-icon`);

        this.svgIcon.node().innerHTML = await this.getSVG();

        const newScale = Math.round(this.meterPerPixel * 32 * 64);
        this.svgIcon
          .selectChild()
          // .attr('x', `${-32}px`).attr('y', `${-32}px`)
          .attr('height', `${newScale}px`)
          .attr('width', `${newScale}px`)
          .attr('x', `${-newScale / 2}px`)
          .attr('y', `${-newScale / 2}px`);
        this.badge();
      } else {
        this.lineThickness = 2;
        this.classes.push('sensor-room-cable');
      }
      if (this.group) this.classes.push(`el-group-${this.group}`);
      if (this.cableType) this.classes.push(`cable-${this.cableType}`);
      this.classes.push(`sensor-${this.sensorType}`);
    }
    if (!this.show(floor)) {
      this.svgIcon.attr('points', '');
      this.svg.attr('points', '');
      return;
    }

    const sensorPoint = this.calcOffsetWall();

    if (!this.cableOnly) {
      this.svgIcon.attr(
        'transform',
        `translate(${sensorPoint[0]}, ${sensorPoint[1]}) scale(${
          this.show(floor) ? 1 / 100 : 1 / 10000
        })`
      );
      this.setClass(this.svgIcon);
    }

    if (!this.sensorOnly) {
      this.svg
        .attr('points', this.cablePoints(sensorPoint, floor).join(' '))
        .attr('stroke-width', this.meterPerPixel * this.lineThickness * 3)
        .attr('transform', this.transform);
      if (this.cableType === CableType.OutsidePOE)
        this.svg.attr(
          'stroke-dasharray',
          `${this.meterPerPixel * this.lineThickness * 10 * 0.5} ${
            this.meterPerPixel * this.lineThickness * 10
          }`
        );
      this.setClass(this.svg);
      this.cableLength = this.getLength();
    }
  }

  cablePoints(sensorPoint: number[], floor: Floor): number[][] {
    return this.show(floor) ? [sensorPoint, ...this.points] : [];
  }

  getLength() {
    const dist = (p1, p2) => Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    let length = 0;

    this.points.forEach((p, i, arr) => {
      if (i + 1 === this.points.length) return;
      length += dist(p, arr[i + 1]);
    });
    return round(2, length + this.verticalCableLength + this.amount * 0.3);
  }

  badge() {
    if (this.amount < 2) return;
    const svg = this.svgIcon.append('g').attr('class', 'sensor-badge');

    svg
      .append('circle')
      .attr('r', 24)
      .attr('cx', 26)
      .attr('fill', this.amount === 2 ? 'white' : '#333')
      .attr('stroke', 'black')
      .attr('cy', -26)
      .attr('stroke-width', this.meterPerPixel * this.lineThickness * 40);

    svg
      .append('text')
      .attr('fill', this.amount === 2 ? 'black' : 'white')
      .attr('x', 26)
      .attr('y', -26 + 4)
      .attr('text-anchor', 'middle')
      .attr('class', 'sensor-badge-text')
      .attr('stroke', 'none')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', this.fontSize * 3)
      .text(`${this.amount}`);
  }

  calcOffsetWall() {
    if (this.parent instanceof Wall) {
      const wall = this.parent as Wall;

      const arr = wall.sides[this.wallSide];
      const angle = angleBetween(arr[0], arr[1]);
      return angleXY(angle + 90, this.offsetWall, this.points[0]);
    } else {
      return [
        this.points[0][0] + this.offset[0],
        this.points[0][1] + this.offset[1],
      ];
    }
  }

  tooltip = (): SafeHtml => {
    // const [all, type, subtype, level, roomCode, side] =
    //   /.(\w+)-(\w+)-(\d)-(\w+)-(\w+)/gi.exec(this.selector); // sensor-socket-0-f-n-2

    let text = `<b>${this.sensorType.toTitleCase()} `;
    // ${this.}-${side}</b> (+${level})`

    if (this.cableLength > 0) {
      text += `<br>Cable length ${round(1, this.cableLength)}m2`;
    }
    if (this.group) {
      text += `<br>Group ${this.group}`;
    }

    return text;
  };

  select() {
    document.querySelectorAll('svg .selected').forEach((d, i) => {
      d.classList.remove('selected');
    });

    if ([SensorType.socket, SensorType.perilex].includes(this.sensorType)) {
      document.querySelectorAll(`.el-group-${this.group}`).forEach((d, i) => {
        d.classList.add('selected');
      });
    } else {
      this.svg.node().classList.add('selected');
      this.svgIcon.node().classList.add('selected');
    }
  }
}
