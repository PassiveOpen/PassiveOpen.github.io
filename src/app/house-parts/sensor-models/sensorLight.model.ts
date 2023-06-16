import { SensorType } from "src/app/components/enum.data";
import { Sensor } from "./sensor.model";

export class SensorLight<T> extends Sensor<T> {
  sensorType = SensorType.lightBulb;

  constructor(data: Partial<Sensor<T>>) {
    super(data);
    Object.assign(this, data);
  }
}
