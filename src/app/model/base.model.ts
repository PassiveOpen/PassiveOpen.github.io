import { House } from '../house/house.model';
import * as d3 from 'd3';
import { Cross } from '../house/cross.model';
import { SafeHtml } from '@angular/platform-browser';
import { Floor } from '../components/enum.data';
import { Stair } from '../house/stairs.model';
import { Wall } from './specific/wall.model';
import { Sensor } from './specific/sensor.model';

let ids = {};

export class BaseSVG {
  floor: Floor;
  name;
  parts: BaseSVG[];
  svg: d3.Selection<SVGGElement, unknown, HTMLElement, undefined>;
  lineThickness = 1;
  classes: string[] = [];
  parent;
  center;
  transform: string = '';
  meterPerPixel: number;
  selector: string = '';
  index = 0;
  visible = true;
  theoretic = false;

  show(floor): boolean {
    return (
      (this.floor === floor || this.floor === Floor.all) &&
      !this.theoretic &&
      this.visible
    );
  }

  async redraw(theme, floor: Floor, meterPerPixel: number) {
    this.onUpdate(theme);

    if (theme instanceof House) {
      if (this.floor === undefined && this.parent && this.parent.floor) {
        this.floor = this.parent.floor;
      }
    } else {
      this.floor = Floor.all;
    }

    this.meterPerPixel = meterPerPixel;
    await this.draw(floor);
  }

  createSelector() {
    if (this.selector) return;
    if (this.parent) {
      if (this.parent instanceof House) {
        if (this.floor === Floor.ground) this.selector = `L0`;
        if (this.floor === Floor.top) this.selector = `L1`;
      } else {
        this.selector = this.parent.selector;
      }
    }

    if (this.name !== undefined) {
      this.selector += `-${this.name.replace(/\s/g, '')}`;
    } else {
      let key = this.constructor.name;
      if ('sensorType' in this) {
        key = this['sensorType'];
      }
      if (!(key in ids)) {
        ids[key] = 0;
      }
      ids[key]++;
      this.selector += `-${key}-${ids[key]}`;
    }
  }

  async draw(floor: Floor) {}

  onUpdate: (theme: Cross | House | Stair) => void;

  tooltip = (x: Cross | House | Stair | Wall): SafeHtml => {
    return `<b>${this.name ? this.name : this.selector}</b>`;
  };

  select() {
    document.querySelectorAll('svg .selected').forEach((d, i) => {
      d.classList.remove('selected');
    });
    this.svg.node().classList.add('selected');
  }

  setClass(svg) {
    if (!svg.node() || !this.classes) {
      return;
    }
    this.classes.forEach((c) => {
      svg.node().classList.add(c);
    });
  }
}
