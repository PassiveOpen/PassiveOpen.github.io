import { Selection } from "d3";

export enum BalloonKey {
  electricity = "electricity",
  thermal = "thermal",
  hotWater = "hot-water",
  net = "net",
  washingMachine = "washing-machine",
  lights = "lights",
  heating = "heating",
  solar = "solar",
  battery = "battery",
  heatPump = "heat-pump",
  tank = "tank",
}

type GElement = Selection<SVGGElement, unknown, null, undefined>;

export class BalloonLink {
  targetKey: BalloonKey;
  width?: number;
  visible?: boolean;
  text?: string;
  g?: GElement;
  path?: Selection<SVGPathElement, unknown, null, undefined>;
  textEl?: Selection<SVGTextElement, unknown, null, undefined>;
  balloon?: Balloon;
  target?: Balloon;
  key = `unknown`;
  get isVisible() {
    return this.visible === true;
  }

  setKey(balloon: Balloon) {
    this.balloon = balloon;
    this.key = `${this.balloon.key}-${this.targetKey}`;
  }

  init(g: GElement, target: Balloon) {
    this.g = g.select(`g#link-${this.key}`);
    this.path = this.g.select<SVGPathElement>("path");
    this.textEl = this.g.select<SVGTextElement>("text");
    this.target = target;
  }

  update() {
    if (this.path === undefined) return;
    const b1 = this.balloon;
    const b2 = this.target;

    if (this.isVisible) {
      this.path.attr("d", `M ${b1.x} ${b1.y} L ${b2.x} ${b2.y}`);
    }

    const length = this.isVisible ? this.path.node().getTotalLength() : 0;
    this.g
      .transition()
      .duration(1000)
      .delay(this.isVisible ? 800 : 0)
      .attr("stroke-dasharray", `${length} 1000 `)
      .attr("stroke-width", this.isVisible ? this.width : 0);
    if (this.textEl === undefined) return;

    if (this.isVisible) {
      this.textEl
        .transition()
        .duration(1000)
        .attr("x", (b1.x + b2.x) / 2)
        .attr("y", (b1.y + b2.y) / 2);
    }
    this.textEl
      .transition()
      .duration(1000)
      .attr("font-size", `${this.isVisible ? 100 : 0}%`);
    if (this.text && this.isVisible) {
      this.textEl.text(this.text);
    }
  }
}

export class Balloon {
  key: BalloonKey;
  name: string;
  icon: string;
  g?: GElement;
  rect?: Selection<SVGRectElement, unknown, null, undefined>;
  x?: number;
  y?: number;
  visible?: boolean;
  links: BalloonLink[] = [];
  get isVisible() {
    return this.visible === true;
  }

  init(g: GElement, width, height) {
    this.g = g.select(`g#balloon-${this.key}`);
    this.rect = this.g.select("rect");
    this.rect;
    this.x = width / 2;
    this.y = height / 2;
    this.update();
  }
  update() {
    const height = 64;
    const width = 64 * 1.618; //phi
    const radius = 4;

    if (this.isVisible) {
      this.rect
        .attr("x", -width / 2)
        .attr("y", -height / 2)
        .attr("stroke-width", 1)
        .attr("height", height)
        .attr("width", width)
        .attr("rx", radius)
        .attr("ry", radius);
    }

    this.g
      .transition()
      .duration(1000)
      .attr(
        "transform",
        `translate(${this.x},${this.y}) scale(${this.isVisible ? 1 : 0})`
      );

    this.links.forEach((l) => l.update());
  }
}

export const balloons: Balloon[] = [
  {
    key: BalloonKey.electricity,
    name: "Electricity",
    icon: "mdi:bolt",
    linkKeys: [
      BalloonKey.thermal,
      BalloonKey.lights,
      BalloonKey.heatPump,
      BalloonKey.washingMachine,
    ],
  },
  {
    key: BalloonKey.thermal,
    name: "Thermal",
    icon: "local:heat.svg", //water_heater",
    linkKeys: [BalloonKey.heating, BalloonKey.hotWater],
  },
  {
    key: BalloonKey.hotWater,
    name: "Hot water",
    icon: "mdi:shower",
  },
  {
    key: BalloonKey.washingMachine,
    name: "Laundry",
    icon: "mdi:local_laundry_service",
  },
  {
    key: BalloonKey.lights,
    name: "Lights",
    icon: "mdi:lightbulb",
  },
  {
    key: BalloonKey.net,
    name: "Net",
    icon: "mdi:electrical_services",
    linkKeys: [BalloonKey.electricity],
  },
  {
    key: BalloonKey.heating,
    name: "Heating",
    icon: "mdi:heat_pump_balance",
  },
  {
    key: BalloonKey.solar,
    name: "Solar",
    icon: "mdi:solar_power",
    linkKeys: [BalloonKey.electricity],
  },
  {
    key: BalloonKey.tank,
    name: "Buffer tank",
    icon: "mdi:water_heater",
    linkKeys: [BalloonKey.thermal],
  },
  {
    key: BalloonKey.battery,
    name: "Battery",
    icon: "mdi:battery_charging_full",
    linkKeys: [BalloonKey.electricity],
  },
  {
    key: BalloonKey.heatPump,
    name: "Heat pump",
    icon: "mdi:heat_pump",
    linkKeys: [BalloonKey.thermal, BalloonKey.tank],
  },
].map((b) => {
  const balloon = new Balloon();
  balloon.key = b.key;
  balloon.name = b.name;
  balloon.icon = b.icon;
  if (b.linkKeys) {
    balloon.links = b.linkKeys.map((k) => {
      const x = new BalloonLink();
      x.targetKey = k;
      x.visible = false;
      x.width = 0;
      x.setKey(balloon);
      return x;
    });
  } else {
    balloon.links = [];
  }

  return balloon;
});
