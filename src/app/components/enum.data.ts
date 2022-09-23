export enum Tag {
  insulated = "insulated",
  orientation = "orientation",

  baseDimension = "base-dimension",
  extensionToNorth = "extension-north",
  extensionToSouth = "extension-south",
  extensionToWest = "extension-west",
  extensionToEast = "extension-east",
  halfCircle = "half-circle",
  bendPoint = "bend-point",

  roofBoth = "roof-both",
  roofCircle = "roof-circle",
  roof70 = "roof-70",
  roofWalls = "roof-walls",
  efficiency = "efficiency",
  greyOut = "greyOut",
  amountSteps = "amount-steps",
  viewlines = "viewlines",

  warmWaterBuffer = "warm-water-buffer",

  iJoists = "i-joits",
  dampOpen = "damp-open",
  airTight = "air-tight",
  pipeLayer = "pipe-layer",
  woodFiberPlate = "wood-fiber-plate",
}

export enum Section {
  welcome = "welcome",
  passiv = "passiv",
  basics = "basics",
  extensions = "extensions",
  tower = "tower",
  end = "end",
  EndOfPageHouse = "EndOfPageHouse",

  //cross
  roofBasics = "roof-basics",
  roofCircle = "roof-circle",
  roofIntermezzo = "roof-intermezzo",
  roof70 = "roof70",
  roofChoice = "roof-choice",
  roofEdge = "roof-edge",

  // Stairs
  stairStart = "stair-start",
  stairBasic = "stair-basic",
  stairCheck = "stair-check",
  stairPlan = "stair-plan",

  // facade

  facadeStart = "facade-start",
  facadeWindow = "facade-window",
  facadeBrick = "facade-Brick",
  facadeDoor = "facade-Door",

  // construction
  constructionWelcome = "construction-welcome",
  constructionFoundation = "construction-foundation",
  constructionCrawlerSpace = "construction-crawler-space",
  constructionRoof = "construction-roof",
  constructionFloor = "construction-floor",
  constructionWall = "construction-wall",
  constructionWallFinish = "construction-wall-finish",

  // installations
  installationWelcome = "installations-welcome",
  installationDrinkWater = "installations-drink-water",
  installationGreyWater = "installations-grey-water",
  installationHeating = "installations-heating",
  installationElectricity = "installations-electricity",
  installationVentilation = "installations-ventilation",
  installationSmartHome = "installations-smartHome",

  //wired power
  wiredWelcome = "wired-welcome",
  wiredPower = "wired-power",
  wiredEthernet = "wired-ethernet",
  wiredSafety = "wired-safety",
  wiredExtra = "wired-extra",
  wiredLight = "wired-light",
  wiredVent = "wired-vent",

  //costs
  costsWelcome = "costs-welcome",
  costsConstruction = "costs-construction",
  costsPreparations = "costs-preparations",
  costsOpenings = "costs-openings",
  costsElectra = "costs-electra",
  costsFinishes = "costs-finishes",
  costsOuterFinishes = "costs-outer-finishes",
  costsTotals = "costs-totals",
}
export enum Floor {
  top = "top",
  ground = "ground",
  ceiling = "ceiling",
  all = "all",
  none = "none",
}
export enum GraphicSide {
  left = "left",
  right = "right",
  none = "none",
}

export enum Graphic {
  plan = "plan",
  cross = "cross",
  stairPlan = "stairPlan",
  stairCross = "stairCross",
  window = "window",
  none = "none",
}

export enum SensorType {
  perilex = "perilex",
  socket = "socket",
  lightBulb = "light-bulb",
  lightSwitch = "light-switch",
  dlc = "dlc",
  dimmer = "dimmer",
  poe = "poe",
  ethernet = "ethernet",
  wifi = "wifi",
  camera = "camera",
  alarm = "alarm",
  smoke = "smoke",
  pir = "pir",
  blinds = "blinds",
  temperature = "temperature",
  ventIn = "vent-in",
  ventOut = "vent-out",
}

export enum State {
  doors = "doors",
  stats = "stats",
  theoreticalWalls = "theoreticalWalls",
  silhouette = "silhouette",
  measure = "measure",
  decoration = "decoration",
  stramien = "stramien",
  towerFootprint = "towerFootprint",
  grid = "grid",
  walkLine = "walkLine",
  minimumHeight = "minimumHeight",
}

export enum CableType {
  OutsidePOE = "OutsidePOE",
  SharedEthernet = "SharedEthernet",
}
export type StatesExtended = State | SensorType | CableType;
