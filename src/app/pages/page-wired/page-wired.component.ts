import { AfterViewInit, Component, NgZone } from "@angular/core";
import { filter } from "d3";
import { AppService } from "src/app/app.service";
import { Section, SensorType, State, Tag } from "src/app/components/enum.data";
import { Sensor } from "src/app/house-parts/sensor-models/sensor.model";
import { House } from "src/app/house/house.model";
import { HouseService } from "src/app/house/house.service";
import { StatesService } from "src/app/services/states.service";
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
  house: House;

  constructor(
    private houseService: HouseService,
    private appService: AppService,
    public statesService: StatesService
  ) {}

  ngAfterViewInit(): void {
    this.statesService.hardSetStates({
      [State.theoreticalWalls]: false,
    });
  }

  getGroups(sensorType: SensorType) {
    this.house = this.houseService.house$.value;
    return [
      ...new Set(
        (this.house.houseParts.sensors as Sensor<any>[])

          .filter((x: Sensor<any>) => x.sensorType === sensorType)
          .map((x: Sensor<any>) => x.group)
      ),
    ]
      .filter((x) => x)
      .sort((a, b) => a - b)
      .join(", ");
  }

  getOutlets(sensorType: SensorType) {
    this.house = this.houseService.house$.value;
    return (this.house.houseParts.sensors as Sensor<any>[])

      .filter((x: Sensor<any>) => x.sensorType === sensorType)
      .map((x: Sensor<any>) => x.amount)
      .reduce((a, b) => a + b, 0);
  }

  getCable(sensorType: SensorType, decimals = 1) {
    this.house = this.houseService.house$.value;
    return round(
      (this.house.houseParts.sensors as Sensor<any>[])

        .filter((x: Sensor<any>) => x.sensorType === sensorType)
        .map((x: Sensor<any>) => x.cableLength)
        .reduce((a, b) => a + b, 0),
      decimals
    );
  }

  getSensorURL(sensorType: SensorType) {
    return `assets/svg/${sensorType.replace("sensor-", "")}.svg`;
  }
}
