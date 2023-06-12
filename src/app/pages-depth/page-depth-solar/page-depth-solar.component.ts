import { AfterViewInit, Component } from "@angular/core";
import { AppService } from "src/app/app.service";
import { Section, Tag } from "src/app/components/enum.data";
import { RoofPoint } from "src/app/house/cross.model";
import { House } from "src/app/house/house.model";
import { HouseService } from "src/app/house/house.service";
import { distanceBetweenPoints, round } from "src/app/shared/global-functions";
import * as SunCalc from "suncalc";

@Component({
  selector: "app-page-depth-solar",
  templateUrl: "./page-depth-solar.component.html",
  styleUrls: ["./page-depth-solar.component.scss"],
})
export class PageDepthSolarComponent implements AfterViewInit {
  Tag = Tag;
  Section = Section;

  lowWattage = 150;
  highWattage = 370;

  size = [110, 185];
  amountPanels = 12 + 6 + 12;
  efficiency = 0.9;

  annualNonHeating = 2000;
  annualHeating = 5000;

  annualHeatingDemand = 12000; // kWh.yr
  energyDemand = 43000; // kWh.yr
  house: House;

  groundFloorSpace;
  totalFloorSpace;

  roofTopLengths;
  roofTopWidth;
  minSun: any;
  maxSun: any;

  get totalWattage() {
    return this.amountPanels * this.highWattage * this.efficiency;
  }

  constructor(
    public appService: AppService,
    private houseService: HouseService
  ) {}

  ngAfterViewInit(): void {
    this.house = this.houseService.house$.value;
    const { ground, all } = this.house.getFloorArea();

    const p = this.house.cross.roofPoints;
    this.roofTopWidth = distanceBetweenPoints(
      p[RoofPoint.bendOutside],
      p[RoofPoint.topOutside]
    );

    this.roofTopLengths = {
      west: this.house.extensionToWest * this.house.studDistance,
      east: this.house.extensionToEast * this.house.studDistance,
      south: this.house.extensionToSouth * this.house.studDistance,
      north: this.house.extensionToNorth * this.house.studDistance,
    };

    this.groundFloorSpace = ground.area;
    this.totalFloorSpace = all.area;

    this.calcSun();
  }

  calcSun() {
    const { lat, lng } = this.house.orientation;
    const shortestDay = new Date(2020, 11, 21, 12, 0, 0);
    const longestDay = new Date(2020, 5, 21, 13, 0, 0);
    [shortestDay, longestDay].forEach((date) => {
      var times = SunCalc.getTimes(date, lat, lng);
      let { altitude } = SunCalc.getPosition(times.solarNoon, lat, lng);
      altitude = round((altitude * 180) / Math.PI, 1);
      if (date.getMonth() < 6 && lat > 0) {
        this.maxSun = altitude;
      } else {
        this.minSun = altitude;
      }
    });
  }

  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + "k";
    }

    return `${value}`;
  }
}
