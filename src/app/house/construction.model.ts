import { ConstructionParts } from "../components/enum.data";
import { offset, round, sum } from "../shared/global-functions";
import { Cross, RoofPoint } from "./cross.model";
import { House, xy } from "./house.model";

export enum Thicknesses {
  gips = "gips",
  serviceBeams = "serviceBeams",
  osb = "osb",
  joists = "joist",
  outerSheet = "outerSheet",
  space = "space",
  facade = "facade",

  // Other than walls
  groundFloorEdge = "groundFloorEdge",
  roofJoists = "roofJoists",
}

export class rowHeatCalc {
  constructor(data: Partial<rowHeatCalc>) {
    Object.assign(this, data);
  }
  updateR(previous: rowHeatCalc) {
    if (previous === undefined) return;

    if (previous.name === "Outside") {
      this.r = 0.04;
    }

    if (this.r === undefined) {
      this.r = this.diameter / this.lambda;
    }
  }
  updateT(previous: rowHeatCalc, rConstruction: number, tempMax: number) {
    if (isNaN(this.r)) return;
    this.deltaT = (this.r / rConstruction) * tempMax;
    this.temp = previous.temp + this.deltaT;
  }
  name: string;
  diameter?;
  lambda?;
  r?;
  deltaT?;
  temp?;
}

export class Construction {
  tempMin = -10;
  tempMax = 24;
  Thicknesses = Thicknesses;

  thickness: { [key in Thicknesses]?: number } = {
    [Thicknesses.gips]: 12.5 / 1000,
    [Thicknesses.serviceBeams]: 60 / 1000,
    [Thicknesses.osb]: 15 / 1000,
    [Thicknesses.joists]: 300 / 1000,
    [Thicknesses.outerSheet]: 600 / 1000,
    [Thicknesses.space]: 40 / 1000,
    [Thicknesses.facade]: 40 / 1000,
    [Thicknesses.roofJoists]: 400 / 1000,
  };

  crossDepth: {
    [key in Thicknesses ]?: number;
  } = {};
  heatCalcs: rowHeatCalc[];

  rConstruction;
  outerWallThickness;
  U;
  cross: Cross;

  get tempDiff() {
    return this.tempMax - this.tempMin;
  }

  getRoofPoint(key: RoofPoint): xy {
    const [x, y] = offset(this.cross.roofPoints[key], [
      -this.cross.wallOuterThickness,
      0,
    ]);
    return [x, -y];
  }

  calculate(house: House) {
    this.cross = house.cross;
    const buildUp = (
      key: Thicknesses,
      previous: Thicknesses,
      negative = false
    ) => {
      this.crossDepth[key] = round(
        Math.abs(this.crossDepth[previous]) + Math.abs(this.thickness[previous])
      );
      if (negative) this.crossDepth[key] = -Math.abs(this.crossDepth[key]);
    };
    this.crossDepth[Thicknesses.joists] = 0;
    this.crossDepth[Thicknesses.osb] = 0;
    this.crossDepth[Thicknesses.groundFloorEdge] = 200/1000;
    buildUp(Thicknesses.outerSheet, Thicknesses.joists);
    buildUp(Thicknesses.space, Thicknesses.outerSheet);
    buildUp(Thicknesses.facade, Thicknesses.space);
    buildUp(Thicknesses.serviceBeams, Thicknesses.osb, true);
    buildUp(Thicknesses.gips, Thicknesses.serviceBeams, true);

    const heatCalcs = [
      new rowHeatCalc({ name: "Outside", temp: this.tempMin }),
      new rowHeatCalc({ name: "r<sub>outside</sub>" }),

      new rowHeatCalc({
        name: "Wood",
        diameter: this.thickness[Thicknesses.facade],
        lambda: 0.13,
      }),
      new rowHeatCalc({
        name: "space",
        diameter: this.thickness[Thicknesses.space],
        lambda: 0.001,
      }),

      new rowHeatCalc({
        name: "Celit",
        diameter: this.thickness[Thicknesses.outerSheet],
        lambda: 0.048,
      }),
      new rowHeatCalc({
        name: "CLS+Glass wol",
        diameter: this.thickness[Thicknesses.joists],
        lambda: 0.032,
      }),
      new rowHeatCalc({
        name: "OBS",
        diameter: this.thickness[Thicknesses.osb],
        lambda: 0.13,
      }),
      new rowHeatCalc({
        name: "Isolated Installations",
        diameter: this.thickness[Thicknesses.serviceBeams],
        lambda: 0.035,
      }),
      new rowHeatCalc({
        name: "Dry wall / Gips ",
        diameter: this.thickness[Thicknesses.gips],
        lambda: 1.3,
      }),
      new rowHeatCalc({ name: "r<sub>inside</sub>" }),
      new rowHeatCalc({ name: "Inside", temp: this.tempMax }),
    ];

    heatCalcs.forEach((x, i) => {
      x.updateR(heatCalcs[i - 1]);
    });

    this.rConstruction = round(
      sum(heatCalcs.map((x) => x.r).filter((x) => x)),
      1
    );
    this.U = round(1 / this.rConstruction, 3);
    this.outerWallThickness = round(
      sum(heatCalcs.map((x) => x.diameter).filter((x) => x)),
      3
    );

    heatCalcs.forEach((x, i) => {
      x.updateT(heatCalcs[i - 1], this.rConstruction, this.tempDiff);
    });

    this.heatCalcs = heatCalcs;
  }

  x = [];
}
