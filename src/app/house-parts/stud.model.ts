import { House, HousePart, xy } from "../house/house.model";
import { HousePartModel } from "./model/housePart.model";
import { StudSVG } from "./svg/stud.svg";
import { Wall, WallType } from "./wall.model";

const maxAmount = 55;
export const createStuds = (house: House) => {
  const walls = house.houseParts.walls.filter(
    (wall: Wall) => wall.type === WallType.outer
  ) as Wall[];

  return [walls[0]].flatMap((wall) => {
    return Array(10)
      .fill(0)
      .map((_, index) => {
        return new Stud({
          main: [0, maxAmount].includes(index),
          coords: [],
          visible: true,
          selector: `grid-index-${index}`,
          wall,
        });
      });
  });
};
// studCoordinates(stud: Stud) {
//   const coords: xy[] = [
//     // studs coords
//     [0, 0],
//     [this.studWidth, 0],
//     [this.studWidth, this.studHeight],
//     [0, this.studHeight],
//     [0, 0],
//   ];

//   const i = offset(stud.wall.origin, [0, stud.index]);

//   stud.coords = coords.map((coord) => offset(coord, i));
// }

// calculate() {
//   if (this.studs.length === 0) this.initStuds();

//   this.studs.forEach((stud, i) => {
//     this.studCoordinates(stud);
//   });
// }

export class Stud extends HousePartModel<StudSVG> {
  housePart: HousePart = HousePart.studs;
  main: boolean;
  coords: xy[];
  visible: boolean;
  wall: Wall;

  constructor(data: Partial<Stud>) {
    super();
    Object.assign(this, data);
  }

  onUpdate(house: House): void {}
  afterUpdate(): void {}
  getSVGInstance(): void {
    this.svg = new StudSVG(this);
  }
}

// export class Studs extends HouseSubPart {
//   weAmount: number;
//   nsAmount: number;

//   studs: Stud[] = [];

//   studWidth = 45 / 1000;
//   studHeight = 300 / 1000;

//   insideFinish = 88 / 1000;
//   outsideFinish = 12 / 1000;

//   constructor() {
//     super();
//   }

//   override onHouseUpdate() {
//     this.calculate();
//   }

// }
