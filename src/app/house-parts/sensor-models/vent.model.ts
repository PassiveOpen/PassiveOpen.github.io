import { SensorType } from "src/app/components/enum.data";
import { Sensor } from "./sensor.model";

export class Vent<T> extends Sensor<T> {
  sensorType = SensorType.ventOut;
  offsetWall = 0;
  size = 200;
  constructor(data: Partial<Vent<T>>) {
    super(data);
    Object.assign(this, data);
  }
}
