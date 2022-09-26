import { round, sum } from "../shared/global-functions";

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
  thicknessJoist = 300;
  thicknessCelit = 60;

  heatCalcs: rowHeatCalc[];

  rConstruction;
  outerWallThickness;
  U;

  get tempDiff() {
    return this.tempMax - this.tempMin;
  }

  calculate(house) {
    const heatCalcs = [
      new rowHeatCalc({ name: "Outside", temp: this.tempMin }),
      new rowHeatCalc({ name: "r<sub>outside</sub>" }),

      new rowHeatCalc({ name: "Wood", diameter: 0.02, lambda: 0.13 }),

      new rowHeatCalc({
        name: "Celit",
        diameter: this.thicknessCelit / 1000,
        lambda: 0.048,
      }),
      new rowHeatCalc({
        name: "CLS+Glaswol",
        diameter: this.thicknessJoist / 1000,
        lambda: 0.032,
      }),
      new rowHeatCalc({ name: "OBS", diameter: 0.015, lambda: 0.13 }),
      new rowHeatCalc({
        name: "Isolated Installations",
        diameter: 0.038,
        lambda: 0.035,
      }),
      new rowHeatCalc({
        name: "Dry wall / Gips ",
        diameter: 0.0125,
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
