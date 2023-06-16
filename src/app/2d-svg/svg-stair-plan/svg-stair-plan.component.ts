import { Component } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Floor, Graphic, Section, State } from "src/app/components/enum.data";
import { HousePart } from "src/app/house/house.model";
import { BasicSVGComponent } from "../base-svg.component";
import { stepsCrossBuildingParts } from "./stair-plan.data";

@Component({
  selector: "app-svg-stair-plan",
  templateUrl: "./svg-stair-plan.component.html",
  styleUrls: ["./svg-stair-plan.component.scss"],
})
export class SvgStairPlanComponent extends BasicSVGComponent {
  graphic = Graphic.stairPlan;
  floor = Floor.all;
  marginInMeters = [0, 0, 0, 0];
  marginInPixels = [64, 64, 0, 0];
  figure;
  steps = new BehaviorSubject(25);

  keys = [HousePart.stairPlan, HousePart.stairWalkLine, HousePart.stairDebug];

  addHousePartModelsAndSVG() {
    stepsCrossBuildingParts.forEach(this.getHousePartsCallback);
    this.keys.forEach((key) => {
      this.house$.value.houseParts[key].forEach(this.getHousePartsCallback);
    });
  }

  setMarginAndSize() {
    this.svgSizeInMeters = [
      this.stair.stairOrigin,
      [this.stair.totalWidth, this.stair.totalHeight],
    ];

    this.marginInMeters = [
      this.stair.run * 2,
      this.stair.run * 2,
      this.stair.run * 2,
      this.stair.run * 2,
    ];
    if (
      [Section.stairStart, Section.stairBasic, Section.stairCheck].includes(
        this.section
      )
    ) {
      this.svg.style("opacity", 0);
      this.svg.style("pointer-events", "none");
    } else {
      this.svg.style("pointer-events", "");
      this.svg.style("opacity", 1);
    }
  }
  updateHousePartSVGs() {}
  afterUpdate() {}
  beforeInit() {}
  afterInit() {}

  setHousePartVisibility() {
    const states = this.statesService.states$.value;
    const house = this.houseService.house$.value;

    this.housePartModels.forEach((housePart) => {
      const key = housePart.housePart;
      let vis = true;

      if (key === HousePart.stairWalkLine) vis = states[State.walkLine];
      if (key === HousePart.stairDebug) vis = states[State.debug];
      if (key === HousePart.measures) vis = states[State.measure];

      housePart.setVisibility(vis);
    });

    // console.log(this.keys.flatMap((k) => this.house$.value.houseParts[k]));

    // console.log(
    //   this.housePartModels.filter(
    //     (x) => x.housePart === HousePart.stairWalkLine
    //   )
    // );
  }
}
