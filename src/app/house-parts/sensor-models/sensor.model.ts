import { SafeHtml } from "@angular/platform-browser";
import { House, HousePart, xy } from "src/app/house/house.model";
import { angleBetween, angleXY, round } from "src/app/shared/global-functions";
import { CableType, Floor, SensorType } from "../../components/enum.data";
import { HousePartModel } from "../model/housePart.model";
import { SensorSVG } from "../svg/sensor.svg";
import { Wall, WallSide } from "../wall.model";

const ids = {};

export class Sensor<T> extends HousePartModel<SensorSVG> {
  housePart: HousePart = HousePart.sensors;
  sensorType: SensorType;
  coords: xy[] = [];
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
  fontSize = 14;
  showBadge = false;
  cableType: CableType;
  sensorPoint: xy;

  constructor(data: Partial<Sensor<T>>) {
    super();
    Object.assign(this, data);
  }

  getSelector() {
    const p = this.parent.selector;
    if (ids[p] === undefined) ids[p] = 0;

    this.selector = `${p}-sensor-${this.sensorType}-${ids[p]++}`;
  }

  onUpdate(house: House): void {}

  afterUpdate(): void {
    this.getSelector();

    this.showBadge = this.amount >= 2;
    if (this.sensorType === SensorType.temperature) {
      this.sensorOnly = true;
    }
    if (this.floor === undefined || this.floor in this.parent) {
      this.floor = (this.parent as any).floor;
    }
    this.sensorPoint = this.calcOffsetWall();
    this.cableLength = this.getLength();
  }

  getSVGInstance(): void {
    this.svg = new SensorSVG(this);
  }

  getSensorType = (str: string) => {
    const a = Object.values(SensorType).find((y) => str?.includes(y));
    return a;
  };
  cablePoints(sensorPoint: number[], floor: Floor): number[][] {
    return this.svg.show(floor) ? [sensorPoint, ...this.coords] : [];
  }

  getLength() {
    const dist = (p1, p2) => Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    let length = 0;

    this.coords.forEach((p, i, arr) => {
      if (i + 1 === this.coords.length) return;
      length += dist(p, arr[i + 1]);
    });
    return round(length + this.verticalCableLength + this.amount * 0.3);
  }

  calcOffsetWall(): xy {
    if (this.parent instanceof Wall) {
      const wall = this.parent as Wall;

      const arr = wall.sides[this.wallSide];
      const angle = angleBetween(arr[0], arr[1]);
      return angleXY(angle + 90, this.offsetWall, this.coords[0]);
    } else {
      return [
        this.coords[0][0] + this.offset[0],
        this.coords[0][1] + this.offset[1],
      ];
    }
  }

  tooltip = (): SafeHtml => {
    // const [all, type, subtype, level, roomCode, side] =
    //   /.(\w+)-(\w+)-(\d)-(\w+)-(\w+)/gi.exec(this.selector); // sensor-socket-0-f-n-2

    let text = `<b>${this.sensorType.toTitleCase()} `;
    // ${this.}-${side}</b> (+${level})`

    if (this.cableLength > 0) {
      text += `<br>Cable length ${round(this.cableLength, 1)}m2`;
    }
    if (this.group) {
      text += `<br>Group ${this.group}`;
    }

    return text;
  };

  select() {
    document.querySelectorAll("svg .selected").forEach((d, i) => {
      d.classList.remove("selected");
    });

    if ([SensorType.socket, SensorType.perilex].includes(this.sensorType)) {
      document.querySelectorAll(`.el-group-${this.group}`).forEach((d, i) => {
        d.classList.add("selected");
      });
    } else {
      this.svg.svg.node().classList.add("selected");
      this.svg.svgIcon.node().classList.add("selected");
    }
  }
}
