import { Wall, WallType } from "../house-parts/wall.model";
import { offset, rotateXY } from "../shared/global-functions";
import { HouseSubPart } from "./general.model";
import { xy } from "./house.model";

export class Stud {
  index: number;
  main: boolean;
  coords: xy[];
  visible: boolean;
  id: string;
  wall: Wall;
  constructor(data: Partial<Stud>) {
    Object.assign(this, data);
  }
}

export class Studs extends HouseSubPart {
  weAmount: number;
  nsAmount: number;

  maxAmount = 55;

  studs: Stud[] = [];

  studWidth = 45 / 1000;
  studHeight = 300 / 1000;

  insideFinish = 88 / 1000;
  outsideFinish = 12 / 1000;

  constructor() {
    super();
  }

  override onHouseUpdate() {
    this.calculate();
  }

  initStuds() {
    const walls = this.house.partsFlatten
      .filter((part) => part instanceof Wall)
      .filter((wall: Wall) => wall.type === WallType.outer) as Wall[];

    [walls[0]].forEach((wall) => {
      console.log(wall);

      this.studs.push(
        ...Array(10)
          .fill(0)
          .map((_, index) => {
            return new Stud({
              index,
              main: [0, this.maxAmount].includes(index),
              coords: [],
              visible: true,
              id: `grid-index-${index}`,
              wall,
            });
          })
      );
    });
  }

  studCoordinates(stud: Stud) {
    const coords: xy[] = [
      // studs coords
      [0, 0],
      [this.studWidth, 0],
      [this.studWidth, this.studHeight],
      [0, this.studHeight],
      [0, 0],
    ];

    const i = offset(stud.wall.origin, [0, stud.index]);

    stud.coords = coords.map((coord) => offset(coord, i));
  }

  calculate() {
    if (this.studs.length === 0) this.initStuds();

    this.studs.forEach((stud, i) => {
      this.studCoordinates(stud);
    });
  }
}
