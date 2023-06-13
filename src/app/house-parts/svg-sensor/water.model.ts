import { SafeHtml } from "@angular/platform-browser";
import { Floor, SensorType } from "src/app/components/enum.data";
import { House } from "src/app/house/house.model";
import { round } from "src/app/shared/global-functions";
import { Sensor } from "../sensor.model";

export class Water<T> extends Sensor<T> {
  offsetWall = 0;
  size = 20;
  verticalCableLength = 0;
  sensorType;

  constructor(data: Partial<Water<T>>) {
    super(data);
    Object.assign(this, data);
  }

  // init(floor: Floor, house: House) {
  //   const ceiling = house.cross.ceilingHeight;
  //   const floorThickness = house.cross.topFloorThickness;

  //   if (this.sensorType === SensorType.toilet) {
  //     this.size = 120;
  //     this.elevation = 0;
  //     this.verticalCableLength +=
  //       floor === Floor.top ? ceiling + floorThickness * 2 : floorThickness;
  //   } else if (this.sensorType === SensorType.waterWarm) {
  //     this.size = 20;
  //     this.elevation = 1.6;
  //     this.verticalCableLength +=
  //       floor === Floor.ground
  //         ? ceiling - this.elevation + floorThickness * 1
  //         : floorThickness + this.elevation;
  //   } else if (this.sensorType === SensorType.drain) {
  //     this.size = 40;
  //     this.elevation = 0;
  //     this.verticalCableLength +=
  //       floor === Floor.top ? ceiling + floorThickness * 2 : floorThickness;
  //   }
  // }

  // tooltip = (): SafeHtml => {
  //   let text = `<b>${this.sensorType.toTitleCase()} `;
  //   if (this.cableLength > 0) {
  //     text += `<br>Pipe length ${round(this.cableLength, 1)}m`;
  //   }
  //   text += `<br>vertical pipe: ${round(this.verticalCableLength, 1)}m`;

  //   return text;
  // };
}
