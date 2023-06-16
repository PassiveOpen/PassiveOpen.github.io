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
  simple = "simple",
  greyOut = "greyOut",
  amountSteps = "amount-steps",
  viewlines = "viewlines",

  warmWaterBuffer = "warm-water-buffer",

  iJoists = "i-joits",
  dampOpen = "damp-open",
  airTight = "air-tight",
  pipeLayer = "pipe-layer",
  woodFiberPlate = "wood-fiber-plate",

  noSun = "no-sun",
  sun = "sun",
  cop = "cop",
}

export enum Section {
  mainWelcome = "main-welcome",
  mainPassiv = "main-passiv",
  mainBasics = "main-basics",
  mainExtensions = "main-extensions",
  mainTower = "main-tower",
  mainEnd = "main-end",
  EndOfPageHouse = "main-EndOfPageHouse",

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
  constructionGroundFloor = "construction-ground-floor",

  constructionWallSole = "construction-wall-sole",
  constructionWallJoists = "construction-wall-joists",
  constructionWallOSB = "construction-wall-osb",
  constructionWallTape = "construction-wall-tape",

  constructionFloorLVL = "construction-floor-lvl",
  constructionRoofRidge = "construction-roof-ridge",
  constructionRoofJoist = "construction-roof-joist",
  constructionRoofInside = "construction-roof-inside",
  constructionRoofOuterSheet = "construction-roof-outerSheet",
  constructionRoofSpace = "construction-roof-space",
  constructionRoofTiles = "construction-roof-tiles",

  constructionWallInsulation = "construction-wall-insulation",
  constructionWallOuterSheet = "construction-wall-outer-sheet",
  constructionWallSpace = "construction-wall-space",
  constructionWallFacade = "construction-wall-facade",
  constructionWallGips = "construction-wall-gips",
  constructionWallService = "construction-wall-service",

  constructionFloor = "construction-floor",
  constructionFloorOSB = "construction-floor-osb",
  constructionRoof = "construction-roof",
  constructionWallFinish = "construction-wall-finish",
  constructionParameters = "construction-parameters",

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
  wiredWater = "wired-water",

  //costs
  costsWelcome = "costs-welcome",
  costsConstruction = "costs-construction",
  costsPreparations = "costs-preparations",
  costsOpenings = "costs-openings",
  costsElectra = "costs-electra",
  costsWater = "costs-water",
  costsFinishes = "costs-finishes",
  costsOuterFinishes = "costs-outer-finishes",
  costsTotals = "costs-totals",

  //planning

  planningPreps = "planning-preps",
  planningFoundation = "planning-foundation",
  planningFraming = "planning-framing",
  planningOutside = "planning-outside",
  planningInstallations = "planning-installations",
  planningFinishing = "planning-finishing",

  //Extra
  House3D = "House3D",

  // energy
  energyWelcome = "energy-welcome",
  energyUsage = "energy-use",
  energyProduction = "energy-production",
  energyProductionProblem1 = "energy-production-problem1",
  energyProductionProblem2 = "energy-production-problem2",
  energyStorage = "energy-storage",
  energyPreserve = "energy-preserve",
  energyAlternatives = "energy-alternatives",

  rainWelcome = "rainWelcome",
  rainSize = "rainSize",
  rainFilter = "rainFilter",
  rainDrink = "rainDrink",
  rainNoRain = "rainNoRain",
  rainReadmore = "rainReadmore",

  // solar
  solarStart = "solarStart",
}
export enum Floor {
  top = "top",
  ground = "ground",
  ceiling = "ceiling",
  all = "all",
  tower = "tower",
  none = "none",
}
export enum GraphicSide {
  left = "left",
  right = "right",
  none = "none",
}

export enum Graphic {
  house2D = "house2D",
  cross = "cross",
  stairPlan = "stairPlan",
  stairCross = "stairCross",
  construction = "construction",
  House3D = "House3D",
  map = "map",
  scrollerHeat = "scrollerHeat",
  none = "none",
}

export enum SensorType {
  perilex = "sensor-perilex",
  socket = "sensor-socket",
  lightBulb = "sensor-light-bulb",
  lightSwitch = "sensor-light-switch",
  dlc = "sensor-dlc",
  dimmer = "sensor-dimmer",
  poe = "sensor-poe",
  ethernet = "sensor-ethernet",
  wifi = "sensor-wifi",
  camera = "sensor-camera",
  alarm = "sensor-alarm",
  smoke = "sensor-smoke",
  pir = "sensor-pir",
  blinds = "sensor-blinds",
  temperature = "sensor-temperature",
  ventIn = "sensor-vent-in",
  ventOut = "sensor-vent-out",
  waterCold = "sensor-water-cold",
  waterRain = "sensor-water-rain",
  waterWarm = "sensor-water-warm",
  drain = "sensor-drain",
  shower = "sensor-shower",
  toilet = "sensor-toilet",
}

export enum State {
  doors = "house-doors",
  stats = "house-stats",
  examplePlan = "house-examplePlan",
  theoreticalWalls = "house-theoreticalWalls",
  silhouette = "house-silhouette",
  measure = "house-measure",
  decoration = "house-decoration",
  stramien = "house-stramien",
  towerFootprint = "house-towerFootprint",
  grid = "house-grid",
  walkLine = "stairs-walkLine",
  debug = "general-debug",
  minimumHeight = "house-minimumHeight",
}

export enum CableType {
  OutsidePOE = "OutsidePOE",
  SharedEthernet = "SharedEthernet",
}
export type StatesExtended =
  | State
  | SensorType
  | CableType
  | ConstructionParts
  | House3DParts
  | Helpers3D;
export enum Helpers3D {
  clipBoxEnabled = "clipBoxEnabled",
  clipBoxShow = "clipBoxShow",
  mirror = "mirror",
}

export enum House3DParts {
  foundation = `house3d-foundation`,
  groundFloor = `house3d-groundFloor`,
  topFloor = `house3d-topFloor`,
  roof = `house3d-roof`,
  innerWall = `house3d-innerWall`,
  outerWall = `house3d-outerWall`,
  studs = `house3d-studs`,
  lvl = `house3d-lvl`,
  debug = `house3d-debug`,
  tower = `house3d-tower`,
}
export enum ConstructionParts {
  foundation = "A1-construction-foundation",
  crawlerSpace = "A2-construction-crawler-space",
  groundFloor = "A3-construction-ground-floor",
  sole = "A4-construction-sole",
  joists = "A5-construction-joists",
  osbWall = "A6-construction-osb-wall",
  tapes = "A7-construction-tapes",

  floorLVL = "B1-construction-floorLVL",
  topFloorJoists = "B2-construction-top-floor-joists",
  topFloorOSB = "B2-construction-top-floor-osb",
  roofRidge = "B3-construction-roof-ridge",
  roofJoists = "B4-construction-roof-joists",
  roofOSB = "B5-construction-roof-osb",

  insulation = "C1-construction-insulation",
  outerSheet = "C2-construction-outerSheet",

  roofOuterSheets = "C3-construction-roof-outerSheet",
  roofSpace = "C4-construction-roof-space",
  roofTiles = "C5-construction-roof-tiles",

  space = "D1-construction-space",
  facade = "D2-construction-facade",

  serviceBeams = "E1-construction-serviceBeams",
  serviceInsulation = "E2-construction-serviceInsulation",
  gips = "E3-construction-gips",
}

export enum Axis {
  red = "red",
  green = "green",
  blue = "blue",
  x = "x",
  y = "y",
  z = "z",
}
