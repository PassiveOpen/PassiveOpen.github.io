import { Floor } from "../components/enum.data";
import { GridType, House, HousePart, Stramien } from "../house/house.model";
import { HousePartModel, HousePartSVG } from "./model/housePart.model";
import { GridLineSVG } from "./svg/gridLine.svg";

export class GridLine<T = House> extends HousePartModel {
  housePart = HousePart.gridLines;
  coords: any;
  type: GridType;
  orientation: "ns" | "we";
  amount: number;

  constructor(data: Partial<GridLine>) {
    super();
    Object.assign(this, data);
  }

  getSVGInstance() {
    this.svg = new GridLineSVG(this);
  }

  onUpdate(house: any): void {}
  afterUpdate(): void {}
}

export const getGridLines = (house: House): GridLine[] => {
  const gridLines = [];

  const margin = 2;

  const floor = (side: string): Floor => {
    if (side === "in") return Floor.all;
    if (side === "out") return Floor.all;
    if (side === "ground") return Floor.ground;
    if (side === "top") return Floor.top;
  };
  for (let type of Object.keys(GridType) as GridType[]) {
    for (let orientation of ["we", "ns"] as any) {
      for (let name of Object.keys(Stramien) as Stramien[]) {
        const id = `house-grid-line-${type}-${orientation}-${name}`;

        const gridLine = new GridLine({
          orientation,
          type,
          name: Stramien.a,
          coords:
            orientation === "ns"
              ? [
                  [-margin, house.stramien[type][orientation][name]],
                  [
                    house.houseWidth + margin,
                    house.stramien[type][orientation][name],
                  ],
                ]
              : [
                  [house.stramien[type][orientation][name], -margin],
                  [
                    house.stramien[type][orientation][name],
                    house.houseLength + margin,
                  ],
                ],
          floor: floor(type),
          selector: id,
        });

        gridLines.push(gridLine);
      }
    }
  }
  return gridLines;
};
