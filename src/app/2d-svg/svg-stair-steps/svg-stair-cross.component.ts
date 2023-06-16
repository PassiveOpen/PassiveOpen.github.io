import { AfterViewInit, Component } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { BasicSVGComponent } from "src/app/2d-svg/base-svg.component";
import { Floor, Graphic, Section } from "src/app/components/enum.data";
import { HousePart } from "src/app/house/house.model";
import { stepsCrossBuildingParts } from "./stair-cross.data";

@Component({
  selector: "app-svg-stair-cross",
  templateUrl: "./svg-stair-cross.component.html",
  styleUrls: ["./svg-stair-cross.component.scss"],
})
export class SvgStairsComponent
  extends BasicSVGComponent
  implements AfterViewInit
{
  graphic = Graphic.stairCross;
  floor = Floor.all;
  steps = new BehaviorSubject(1);

  keys = [HousePart.stairPlan];

  addHousePartModelsAndSVG() {
    stepsCrossBuildingParts.forEach(this.getHousePartsCallback);
    this.keys.forEach((key) => {
      this.house$.value.houseParts[key].forEach(this.getHousePartsCallback);
    });
  }

  updateHousePartSVGs() {}
  afterUpdate() {}
  beforeInit() {}
  afterInit() {}
  setMarginAndSize() {
    const maxRun = this.stair.totalRise / Math.tan(30 * (Math.PI / 180));

    if ([Section.stairCheck, Section.stairPlan].includes(this.section)) {
      this.svgSizeInMeters = [
        [this.stair.run * 5, -this.stair.rise * 9],
        [this.stair.run * 4, this.stair.rise * 4],
      ];
    } else {
      this.svgSizeInMeters = [
        [-this.stair.run, -this.stair.totalRise],
        [maxRun, this.stair.totalRise + this.stair.floorThickness],
      ];
      this.marginInPixels = [40, 40, 80, 40];
    }

    this.marginInMeters = [0, this.stair.run * 2, 0, 0];

    if ([Section.stairPlan].includes(this.section)) {
      this.svg.style("opacity", 0);
      this.svg.style("pointer-events", "none");
    } else {
      this.svg.style("pointer-events", "");
      this.svg.style("opacity", 1);
    }
  }

  setHousePartVisibility() {
    const states = this.statesService.states$.value;
    const house = this.houseService.house$.value;

    this.housePartModels.forEach((model) => {
      let vis = true;

      model.setVisibility(vis);
    });

    // console.log(this.house$.value.houseParts[HousePart.stairPlan]);
  }
}
