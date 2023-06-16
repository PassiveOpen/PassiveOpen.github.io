import { Floor } from "../components/enum.data";
import { House, HousePart, xy } from "../house/house.model";
import { angleXY, offset, rotateXY } from "../shared/global-functions";
import { HousePartModel } from "./model/housePart.model";
import { StudSVG } from "./svg/stud.svg";
import { Wall, WallType } from "./wall.model";

const studWidth = 45 / 1000;
const studHeight = 300 / 1000;
const insideFinish = 88 / 1000;
const outsideFinish = 144 / 1000;
const maxAmount = 55;

let id = 0;

export const createStuds = (house: House) => {
  const walls = house.houseParts.walls.filter(
    (wall: Wall) => wall.type === WallType.outer && wall.tower !== true
  ) as Wall[];

  return walls.flatMap((wall) => {
    return Array(10)
      .fill(0)
      .map((_, index) => {
        return new Stud({
          main: [0, maxAmount].includes(index),
          visible: true,
          selector: `stud-${index}-${id++}`,
          wall,
          floor: Floor.all,
          parent: wall,
          index,
        });
      });
  });
};

export class Stud extends HousePartModel<StudSVG> {
  housePart: HousePart = HousePart.studs;
  main: boolean;
  coords: xy[];
  visible: boolean;
  wall: Wall;
  index: number;

  constructor(data: Partial<Stud>) {
    super();
    Object.assign(this, data);
  }

  onUpdate(house: House): void {
    const distance = 0.6;
    // const origin = offset(this.wall.origin, [-insideFinish, -insideFinish]);
    const start = angleXY(this.wall.angle, -insideFinish, this.wall.origin);
    const origin = angleXY(this.wall.angle - 90, 0, start);

    this.coords = this.template()
      .map((coord: xy) => rotateXY(coord, [0, 0], this.wall.angle + 180))
      .map((coord: xy) =>
        angleXY(
          this.wall.angle,
          this.index === 0 ? -0.3 : distance * (this.index - 1),
          coord
        )
      )
      .map((coord: xy) => offset(origin, coord));
  }
  afterUpdate(): void {}
  getSVGInstance(): void {
    this.svg = new StudSVG(this);
  }

  template() {
    return [
      [0, 0],
      [studWidth, 0],
      [studWidth, studHeight],
      [0, studHeight],
      [0, 0],
    ];
  }
}
