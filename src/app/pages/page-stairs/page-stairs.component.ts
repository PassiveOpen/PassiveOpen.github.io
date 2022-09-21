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
  deltas = 4;

  update = this.houseService.update;
  constructor(
    private houseService: HouseService,
    private appService: AppService
  ) {}

  // angle 37
  //t 570 ≤ M ≤ 630 mm stapmodules
  // OP 170 - 190
  // aaan 200 - 260

  ngAfterViewInit(): void {}

  sizeLabel(value) {
    return `${value}m`;
  }

  get totalRunMax() {
    const stair = this.house$.value.stair;
    return round(stair.totalRise / Math.tan(toRadians(30)), 1);
  }
  get totalRunMin() {
    const stair = this.house$.value.stair;
    return round(stair.totalRise / Math.tan(toRadians(35)), 1);
  }

  get rangeRun() {
    return this.totalRunMax - this.totalRunMin;
  }

  get rangeSteps() {
    const stair = this.house$.value.stair;
    return stair.maxSteps - stair.minSteps + 1;
  }

  currentRun(dx) {
    return round((dx / (this.deltas - 1)) * this.rangeRun + this.totalRunMin);
  }

  currentCell(steps, dx) {
    // 22	30
    const stair = this.house$.value.stair;
    const totalRun = this.currentRun(dx);
    const run = round((totalRun / (stair.minSteps + steps)) * 1000, -1);

    return run;
  }

  score(run, rise) {
    if (run < 220) {
      return "too-little";
    }
    if (run > 300) {
      return "too-much";
    }
  }
  select(steps, totalRun) {
    this.update("stair", "steps", steps);
    this.update("stair", "totalRun", totalRun);
  }
}
