import { Injectable } from "@angular/core";
import { House } from "./house.model";
import {
  ConstructionParts,
  Section,
  SensorType,
  State,
  StatesExtended,
} from "../components/enum.data";
import { AppService, StateObj } from "../app.service";
import { HouseService } from "./house.service";
import { Measure } from "../model/specific/measure.model";
import { Cross } from "./cross.model";
import { Wall, WallType } from "../model/specific/wall.model";
import { Door } from "../model/specific/door.model";
import { Sensor } from "../model/specific/sensors/sensor.model";
import { throttle, throttleTime } from "rxjs";
import { state } from "@angular/animations";

@Injectable({
  providedIn: "root",
})
export class StateService {
  states: StateObj;
  house: House;
  cross: Cross;
  section;

  constructor(
    private appService: AppService,
    private houseService: HouseService
  ) {
    this.appService.states$.subscribe((states) => {
      this.states = states;
      this.house = this.houseService.house$.value;
      this.cross = this.house.cross;
      this.filterOut();
      this.appService.update$.next();
    });
  }

  /**
   * Updates state$ once based on sections
   */
  updateStateBasedOnSection(section: Section, checkCookie) {
    if (this.section === section) return;
    this.section = section;

    const arr = this.appService.states$.value;
    this.buildState(arr, [State.grid], [Section.basics].includes(section));

    this.buildState(
      arr,
      [State.silhouette],
      [Section.roofEdge].includes(section)
    );

    this.buildState(
      arr,
      [State.measure, State.minimumHeight],
      [
        Section.stairBasic,
        Section.stairCheck,
        Section.stairPlan,
        Section.basics,
        Section.roof70,
        Section.roofCircle,
      ].includes(section)
    );

    this.buildState(
      arr,
      [State.doors],
      ![Section.passiv, Section.welcome].includes(section)
    );

    this.buildState(
      arr,
      [SensorType.socket, SensorType.perilex],
      [Section.wiredPower].includes(section)
    );
    this.buildState(
      arr,
      [SensorType.poe, SensorType.ethernet, SensorType.wifi],
      [Section.wiredEthernet].includes(section)
    );
    this.buildState(
      arr,
      [SensorType.ventIn, SensorType.ventOut],
      [Section.wiredVent].includes(section)
    );
    this.buildState(
      arr,
      [
        SensorType.dimmer,
        SensorType.dlc,
        SensorType.lightBulb,
        SensorType.lightSwitch,
      ],
      [Section.wiredLight].includes(section)
    );
    this.buildState(
      arr,
      [
        SensorType.toilet,
        SensorType.shower,
        SensorType.drain,
        SensorType.waterCold,
        SensorType.waterRain,
        SensorType.waterWarm,
      ],
      [Section.wiredWater].includes(section)
    );
    this.buildState(
      arr,
      [SensorType.camera, SensorType.alarm, SensorType.smoke],
      [Section.wiredSafety].includes(section)
    );
    this.buildState(
      arr,
      [SensorType.pir],
      [Section.wiredExtra, Section.wiredSafety].includes(section)
    );
    this.buildState(
      arr,
      [SensorType.blinds, SensorType.temperature],
      [Section.wiredExtra].includes(section)
    );
    this.statesForConstruction(arr, section);
    this.appService.commitState(arr);
  }

  statesForConstruction(arr, section) {
    const buildUp = [];

    //  <======= Inside =======> //
    buildUp.push(Section.constructionWallGips);
    this.buildState(
      arr,
      [ConstructionParts.gips],
      [...buildUp].includes(section)
    );

    buildUp.push(Section.constructionWallService);
    this.buildState(
      arr,
      [ConstructionParts.serviceBeams, ConstructionParts.serviceInsulation],
      [...buildUp].includes(section)
    );
    //  <======= Inside =======> //

    //  <======= Outside =======> //
    buildUp.push(Section.constructionWallFacade);
    this.buildState(
      arr,
      [ConstructionParts.facade],
      [...buildUp].includes(section)
    );

    buildUp.push(Section.constructionWallSpace);
    this.buildState(
      arr,
      [ConstructionParts.space],
      [...buildUp].includes(section)
    );

    buildUp.push(Section.constructionRoofTiles);
    this.buildState(
      arr,
      [ConstructionParts.roofTiles],
      [...buildUp].includes(section)
    );
    buildUp.push(Section.constructionRoofSpace);
    this.buildState(
      arr,
      [ConstructionParts.roofSpace],
      [...buildUp].includes(section)
    );
    buildUp.push(Section.constructionRoofOuterSheet);
    buildUp.push(Section.constructionWallOuterSheet);
    this.buildState(
      arr,
      [ConstructionParts.outerSheet, ConstructionParts.roofOuterSheets],
      [...buildUp].includes(section)
    );

    buildUp.push(Section.constructionWallInsulation);
    this.buildState(
      arr,
      [ConstructionParts.insulation],
      [...buildUp].includes(section)
    );
    //  <======= Outside =======> //

    //  <======= Floor&Roof =======> //
    buildUp.push(Section.constructionRoofInside);
    this.buildState(
      arr,
      [ConstructionParts.roofOSB],
      [...buildUp].includes(section)
    );
    buildUp.push(Section.constructionRoofJoist);
    this.buildState(
      arr,
      [ConstructionParts.roofJoists],
      [...buildUp].includes(section)
    );
    buildUp.push(Section.constructionRoofRidge);
    this.buildState(
      arr,
      [ConstructionParts.roofRidge],
      [...buildUp].includes(section)
    );
    buildUp.push(Section.constructionFloor);
    this.buildState(
      arr,
      [ConstructionParts.topFloorJoists, ConstructionParts.topFloorOSB],
      [...buildUp].includes(section)
    );
    buildUp.push(Section.constructionFloorLVL);
    this.buildState(
      arr,
      [ConstructionParts.floorLVL],
      [...buildUp].includes(section)
    );
    //  <======= Floor&Roof =======> //

    //  <======= Pre floor =======> //
    buildUp.push(Section.constructionWallTape);
    this.buildState(
      arr,
      [ConstructionParts.tapes],
      [...buildUp].includes(section)
    );

    buildUp.push(Section.constructionWallOSB);
    this.buildState(
      arr,
      [ConstructionParts.osbWall],
      [...buildUp].includes(section)
    );

    buildUp.push(Section.constructionWallJoists);
    this.buildState(
      arr,
      [ConstructionParts.joists],
      [...buildUp].includes(section)
    );

    buildUp.push(Section.constructionWallSole);
    this.buildState(
      arr,
      [ConstructionParts.sole],
      [...buildUp].includes(section)
    );
    //  <======= Pre floor =======> //

    //  <======= Below ground =======> //
    buildUp.push(Section.constructionGroundFloor);
    this.buildState(
      arr,
      [ConstructionParts.groundFloor],
      [...buildUp].includes(section)
    );

    buildUp.push(Section.constructionCrawlerSpace);
    this.buildState(
      arr,
      [ConstructionParts.crawlerSpace],
      [...buildUp].includes(section)
    );

    buildUp.push(Section.constructionFoundation);
    this.buildState(
      arr,
      [ConstructionParts.foundation],
      [...buildUp].includes(section)
    );
  }

  /**
   * Filter all baseSVGs
   */
  filterOut() {
    // console.log("filterOut");

    // minimumHeight
    //// ========== towerFootprint ==========
    this.house.tower.footprintVisible = this.states[State.towerFootprint];

    //// ========== Doors ==========
    this.house.partsFlatten
      .filter((x) => x instanceof Door)
      .forEach((x) => (x.visible = this.states[State.doors]));

    //// ========== Theoretical walls ==========
    this.house.partsFlatten
      .filter((x) => x instanceof Wall)
      .filter((x: Wall) => x.type === WallType.theoretic)
      .forEach((x) => (x.outOfDesign = !this.states[State.theoreticalWalls]));

    //// ========== Measures ==========
    [...this.house.parts, ...this.cross.parts, ...this.house.stair.parts]
      .filter((x) => x instanceof Measure)
      .forEach((x) => (x.visible = this.states[State.measure]));

    //// ========== Stramien ==========
    this.house.parts
      .filter((x) => x.selector.includes("house-stramien-"))
      .forEach((x) => {
        x.visible = this.states[State.stramien];
      });

    //// ========== Grid ==========
    this.house.parts
      .filter((x) => x.selector.includes("grid-index"))
      .forEach((x) => {
        x.visible = this.states[State.grid];
      });

    //// ========== Sensors ==========
    this.house.partsFlatten
      .filter((x) => x instanceof Sensor)
      .forEach((x: Sensor<any>) => {
        x.visible = this.states[x.sensorType];
      });
  }

  buildState(arr, states: StatesExtended[], bool: boolean) {
    states.forEach((state) => {
      arr[state] = bool;
    });
  }
}
