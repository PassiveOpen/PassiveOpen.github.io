import { AfterViewInit, Component, NgZone } from "@angular/core";
import { filter } from "d3";
import { AppService } from "src/app/app.service";
import { Section, SensorType, State, Tag } from "src/app/components/enum.data";
import { HouseService } from "src/app/house/house.service";
import { Sensor } from "src/app/model/specific/sensors/sensor.model";
import { round } from "src/app/shared/global-functions";

@Component({
  selector: "app-page-wired",
  templateUrl: "./page-wired.component.html",
  styleUrls: ["./page-wired.component.scss"],
})
export class PageWiredComponent implements AfterViewInit {
  Tag = Tag;
  Section = Section;
  SensorType = SensorType;

  constructor(
    private houseService: HouseService,
    private appService: AppService
  ) {}

  ngAfterViewInit(): void {
    this.appService.hardSetStates({
      [State.theoreticalWalls]: false,
    });
  }

  getGroups(sensorType: SensorType) {
    const house = this.houseService.house$.value;
    return [
      ...new Set(
        Object.values(house.partsFlatten)
          .filter((x) => x instanceof Sensor)
          .filter((x: Sensor<any>) => x.sensorType === sensorType)
          .map((x: Sensor<any>) => x.group)
      ),
    ]
      .filter((x) => x)
      .sort((a, b) => a - b)
      .join(", ");
  }

  getOutlets(sensorType: SensorType) {
    const house = this.houseService.house$.value;
    return Object.values(house.partsFlatten)
      .filter((x) => x instanceof Sensor)
      .filter((x: Sensor<any>) => x.sensorType === sensorType)
      .map((x: Sensor<any>) => x.amount)
      .reduce((a, b) => a + b, 0);
  }

  getCable(sensorType: SensorType, decimals = 1) {
    const house = this.houseService.house$.value;
    return round(
      Object.values(house.partsFlatten)
        .filter((x) => x instanceof Sensor)
        .filter((x: Sensor<any>) => x.sensorType === sensorType)
        .map((x: Sensor<any>) => x.cableLength)
        .reduce((a, b) => a + b, 0),
      decimals
    );
  }
}
