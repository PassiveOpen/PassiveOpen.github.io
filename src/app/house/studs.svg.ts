import { Floor } from "../components/enum.data";
import { BaseSVG } from "../model/base.model";
import { AppPolygon } from "../model/polygon.model";
import { Studs } from "./studs.model";

export class StudsSvg {
  studs: Studs;

  parts: BaseSVG[] = [];

  constructor(studs: Studs) {
    this.studs = studs;
  }

  initSVGElements() {
    // this.studs.studs.forEach((stud) => {
    //   const part = new AppPolygon({
    //     selector: stud.id,
    //     lineThickness: stud.main ? 0.8 : 0.6,
    //     index: stud.index,
    //     floor: Floor.all,
    //     onUpdate: function (grid: Studs) {
    //       this.coords = stud.coords;
    //     },
    //   });
    //   part.createSelector();
    //   this.parts.push(part);
    // });
    // console.log(this.parts[1]);
  }
}
