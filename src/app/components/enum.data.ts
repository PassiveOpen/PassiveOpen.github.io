export enum Tag {
  insulated = 'insulated',
  orientation = 'orientation',

  baseDimension = 'base-dimension',
  extensionToNorth = 'extension-north',
  extensionToSouth = 'extension-south',
  extensionToWest = 'extension-west',
  extensionToEast = 'extension-east',
  halfCircle = 'half-circle',
  bendPoint = 'bend-point',

  roofBoth = 'roof-both',
  roofCircle = 'roof-circle',
  roof70 = 'roof-70',
  roofWalls = 'roof-walls',
  efficiency = 'efficiency',
  greyOut = 'greyOut',
  amountSteps = 'amount-steps',
  viewlines = 'viewlines',

  warmWaterBuffer = 'warm-water-buffer',

  iJoists = 'i-joits',
  dampOpen = 'damp-open',
  airTight = 'air-tight',
  pipeLayer = 'pipe-layer',
  woodFiberPlate = 'wood-fiber-plate',
}

export enum Section {
  welcome = 'welcome',
  passiv = 'passiv',
  basics = 'basics',
  extensions = 'extensions',
  tower = 'tower',
  end = 'end',

  //cross
  roofBasics = 'roof-basics',
  roofCircle = 'roof-circle',
  roofIntermezzo = 'roof-intermezzo',
  roof70 = 'roof70',
  roofChoice = 'roof-choice',
  roofEdge = 'roof-edge',

  // Stairs
  stairStart = 'stair-start',
  stairBasic = 'stair-basic',
  stairCheck = 'stair-check',
  stairPlan = 'stair-plan',

  // facade

  facadeStart = 'facade-start',
  facadeWindow = 'facade-window',
  facadeBrick = 'facade-Brick',
  facadeDoor = 'facade-Door',

  // contruction
  contructionFoundation = 'contruction-foundation',
  contructionCrawlerSpace = 'contruction-crawler-space',
  contructionRoof = 'contruction-roof',
  contructionFloor = 'contruction-floor',
  contructionWall = 'contruction-wall',
  contructionWallFinish = 'contruction-wall-finish',

  // instaltions
  instaltionDrinkWater = 'instaltions-drink-water',
  instaltionGreyWater = 'instaltions-grey-water',
  instaltionHeating = 'instaltions-heating',
  instaltionElectricity = 'instaltions-electricity',
  instaltionVentilation = 'instaltions-ventilation',
  instaltionSmartHome = 'instaltions-smartHome',

  //wired power
  wiredPower = 'wired-power',
  wiredEthernet = 'wired-ethernet',
  wiredSafety = 'wired-safety',
  wiredExtra = 'wired-extra',
  wiredLight = 'wired-light',
}

export enum State {
  doors = 'doors',
  stats = 'stats',
  theoreticalWalls = 'theoreticalWalls',
  grey = 'grey',
  measure = 'measure',
  decoration = 'decoration',
  stramien = 'stramien',
  towerFootprint = 'towerFootprint',
  grid = 'grid',
}
export enum Floor {
  top = 'top',
  ground = 'ground',
  ceiling = 'ceiling',
  all = 'all',
  none = 'none',
}
export enum GraphicSide {
  left = 'left',
  right = 'right',
}

export enum Graphic {
  plan = 'plan',
  cross = 'cross',
  stair = 'stair',
  window = 'window',
  none = 'none',
}

export enum SensorType {
  socket = 'socket',
  perilex = 'perilex',
  pir = 'pir',
  poe = 'poe',
  ethernet = 'ethernet',
  light = 'light',
  lightSwitch = 'light-switch',
  dimmer = 'dimmer',
  blinds = 'blinds',
  temperature = 'temperature',
  alarm = 'alarm',
  dlc = 'dlc',
  ventIn = 'vent-in',
  ventOut = 'vent-out',
  smoke = 'smoke',
  wifi = 'wifi',
  camera = 'camera',
}

export enum CableType {
  OutsidePOE = 'OutsidePOE',
  SharedEthernet = 'SharedEthernet',
}
