import { House, HousePart, xy } from "../house/house.model";
import { HousePartModel, HousePartSVG } from "./model/housePart.model";
import { CircleSVG } from "./svg-other/circle.svg";
import { DistanceSVG } from "./svg-other/distance.svg";
import { EmbeddedSVG } from "./svg-other/embedded-svg.svg";
import { PathSVG } from "./svg-other/path.svg";
import { PolygonSVG } from "./svg-other/polygon.svg";
import { PolylineSVG } from "./svg-other/polyline.svg";

export class Other<T extends HousePartSVG> extends HousePartModel {
  housePart = HousePart.other;
  coords: xy[] = [];
  dataSVG: Partial<T>;
  type: "polygon" | "path" | "polyline" | "circle" | "svg" | "distance";

  constructor(data: Partial<Other<T>>) {
    super();
    Object.assign(this, data);
    if (this.dataSVG === undefined) this.dataSVG = {};
  }

  setup(): void {}
  onUpdate(house: House) {} // in user data
  afterUpdate(): void {
    if (this.selector === undefined) {
      console.log(this);

      throw new Error(`Selector is undefined`);
    }
  }

  getSVGInstance() {
    if (this.type === "polygon") this.svg = new PolygonSVG(this);
    if (this.type === "polyline") this.svg = new PolylineSVG(this);
    if (this.type === "path") this.svg = new PathSVG(this);
    if (this.type === "circle") this.svg = new CircleSVG(this);
    if (this.type === "svg") this.svg = new EmbeddedSVG(this);
    if (this.type === "distance") this.svg = new DistanceSVG(this);
    if (this.svg === undefined) {
      console.log(this);
      throw new Error(
        `getSVGInstance: [type] is unknown ${this.type}, ${this.selector}`
      );
    }
    Object.assign(this.svg, this.dataSVG);
  }

  applyDataSVG() {
    const setKey = <U>(key: keyof U) => {
      const dataSVG = this.dataSVG as any as Partial<U>;
      if (dataSVG[key] !== undefined) this.svg[key] = dataSVG[key];
    };
    if (this.svg === undefined) {
      // console.log("not loaded yet...");
    } else if (this.svg instanceof PathSVG && this.type === "path") {
      setKey<PathSVG>("d");
      setKey<PathSVG>("transform");
    } else if (this.svg instanceof PolygonSVG && this.type === "polygon") {
      setKey<PolygonSVG>("transform");
    } else if (this.svg instanceof PolylineSVG && this.type === "polyline") {
      setKey<PolylineSVG>("transform");
    } else if (this.svg instanceof CircleSVG && this.type === "circle") {
      setKey<CircleSVG>("cx");
      setKey<CircleSVG>("cy");
      setKey<CircleSVG>("r");
    } else if (this.svg instanceof EmbeddedSVG && this.type === "svg") {
      setKey<EmbeddedSVG>("rotation");
      setKey<EmbeddedSVG>("anchor");
      setKey<EmbeddedSVG>("scale");
      setKey<EmbeddedSVG>("scaler");
    } else {
      console.log(this);

      throw new Error(`setAttr: is unknown, ${this.type}`);
    }
  }

  square(w: number, h: number, origin: xy) {
    this.coords = [
      [origin[0], origin[1]],
      [origin[0] + w, origin[1]],
      [origin[0] + w, origin[1] + h],
      [origin[0], origin[1] + h],
    ];
  }
}
