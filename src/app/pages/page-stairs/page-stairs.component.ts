import { AfterViewInit, Component, HostListener } from "@angular/core";
import { AppService } from "src/app/app.service";
import { Section, Tag } from "src/app/components/enum.data";
import { House } from "src/app/house/house.model";
import { HouseService } from "src/app/house/house.service";
import { round, toRadians } from "src/app/shared/global-functions";

@Component({
  selector: "app-page-stairs",
  templateUrl: "./page-stairs.component.html",
  styleUrls: ["./page-stairs.component.scss"],
})
export class PageStairsComponent implements AfterViewInit {
  house$ = this.houseService.house$;
  Section = Section;
  Tag = Tag;
  tagsKeys = Object.keys(Tag);
  // deltas = 10;
  minAngle = 30;
  maxAngle = 42; //35

  update = this.houseService.update;
  round = round;

  constructor(
    private houseService: HouseService,
    private appService: AppService
  ) {}

  // angle 37
  //t
  // OP 170 - 190
  // aaan 200 - 260

  ngAfterViewInit(): void {
    this.house$.value.stair;
  }

  sizeLabel(value) {
    return `${value}m`;
  }

  get totalRunMax() {
    const stair = this.house$.value.stair;
    return round(stair.totalRise / Math.tan(toRadians(this.minAngle)), 1);
  }
  get totalRunMin() {
    const stair = this.house$.value.stair;
    return round(stair.totalRise / Math.tan(toRadians(this.maxAngle)), 1);
  }
  get deltas() {
    return (Math.ceil(this.rangeRun / 0.1) - 1) | 1;
  }

  get rangeRun() {
    return this.totalRunMax - this.totalRunMin;
  }

  get rangeSteps() {
    const stair = this.house$.value.stair;
    return stair.maxSteps - stair.minSteps + 1;
  }

  totalRunByIndex(dx) {
    return round(
      (dx / (this.deltas - 1)) * this.rangeRun + this.totalRunMin,
      1
    );
  }

  getRun(steps, dx) {
    const stair = this.house$.value.stair;
    const totalRun = this.totalRunByIndex(dx);
    const run = round((totalRun / (stair.minSteps + steps)) * 1000, 0);
    return run;
  }
  getRise(steps) {
    const stair = this.house$.value.stair;
    const rise = round((stair.totalRise / (stair.minSteps + steps)) * 1000, 0);
    return rise;
  }

  scoreComfort(run, rise) {
    const total = run + rise * 2;
    return Math.abs(total - 600); // 570 ≤ M ≤ 630 mm
  }
  scoreColor(run, rise) {
    const value = this.scoreComfort(run, rise);
    if (value > 30) {
      return;
    }
    const alpha = 0.6 - (0.8 / 30) * value;

    return `rgba(0, 115, 0, ${alpha})`;
  }

  score(run, rise) {
    const stair = this.house$.value.stair;

    const current =
      Math.abs(stair.run * 1000 - run) < 1 &&
      Math.abs(stair.rise * 1000 - rise) < 1
        ? " active"
        : "";

    if (run < 220) {
      return "too-little" + current;
    } else if (run > 300) {
      return "too-much" + current;
    } else if (this.scoreComfort(run, rise) > 30) {
      return "not-comfortable" + current;
    } else {
      return "comfortable" + current;
    }
  }

  select(steps, totalRun) {
    this.update("stair", "steps", steps);
    this.update("stair", "totalRun", totalRun);
  }
}
