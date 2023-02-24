import { House, SvgUpdate } from "../house/house.model";
import * as d3 from "d3";
import { Cross } from "../house/cross.model";
import { SafeHtml } from "@angular/platform-browser";
import { Floor } from "../components/enum.data";
import { Stair } from "../house/stairs.model";
import { Wall } from "./specific/wall.model";
import { Sensor } from "./specific/sensors/sensor.model";

let ids = {};

export class BaseSVG {
  floor: Floor; // no default, block inheritance
  name;
  parts: BaseSVG[];
  svg: d3.Selection<SVGGElement, unknown, HTMLElement, undefined>;
  classes: string[] = [];
  parent;
  center;
  transform: string = "";
  meterPerPixel: number;
  selector: string = "";
  index = 0;
  visible = true;
  outOfDesign = false;
  theoretic = false;
  loaded = false;
  svgUpdate: SvgUpdate;

  _lineThickness = 1;
  get lineThickness(): number {
    return this._lineThickness;
  }
  set lineThickness(x: number) {
    this._lineThickness = x;
  }

  async draw(floor: Floor) {}
  redraw(floor: Floor) {}
  init(floor: Floor, theme: Cross | House | Stair) {}
  onUpdate: (theme: Cross | House | Stair) => void;
  tooltip = (x: Cross | House | Stair | Wall): SafeHtml => {
    return `<b>${this.name ? this.name : this.selector}</b>`;
  };

  show(floor): boolean {
    return (
      (this.floor === this.svgUpdate.floor || this.floor === Floor.all) &&
      !this.theoretic &&
      this.visible &&
      !this.outOfDesign
    );
  }

  async update(svgUpdate: SvgUpdate) {
    this.svgUpdate = svgUpdate;
    // Calculated as defined in the user file
    this.onUpdate(this.svgUpdate.theme);

    const activeFloor = this.svgUpdate.floor;

    this.meterPerPixel = this.svgUpdate.meterPerPixel;

    if (this.svgUpdate.redrawAll) {
      // aka instance of House (House is based on this class! dont use instanceof).
      if ((this.svgUpdate.theme as House).showTower !== undefined) {
        if (this.floor === undefined && this.parent && this.parent.floor) {
          this.floor = this.parent.floor;
        }
      } else {
        this.floor = Floor.all;
      }
      this.init(activeFloor, this.svgUpdate.theme);
      await this.draw(activeFloor); // This draws all for the first time
    }
    if (this.show(activeFloor)) {
      await this.redraw(activeFloor); // this updates all the sizes after a zoom.
    }
  }

  createSelector() {
    if (this.selector) return;
    if (this.parent) {
      if (this.parent.selector) {
        this.selector = this.parent.selector;
      } else {
        if (this.floor === Floor.ground) this.selector = `L0`;
        if (this.floor === Floor.top) this.selector = `L1`;
      }
    }

    if (this.name !== undefined) {
      this.selector += `-${this.name.replace(/\s/g, "")}`;
    } else {
      let key = this.constructor.name;
      if ("sensorType" in this) {
        key = this["sensorType"] as string;
      }
      if (!(key in ids)) {
        ids[key] = 0;
      }
      ids[key]++;
      this.selector += `-${key}-${ids[key]}`;
    }
  }

  select() {
    document.querySelectorAll("svg .selected").forEach((d, i) => {
      d.classList.remove("selected");
    });
    this.svg.node().classList.add("selected");
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
