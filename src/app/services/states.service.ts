import { Injectable } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { BehaviorSubject } from "rxjs";
import { StateObj } from "../app.service";
import {
  ConstructionParts,
  Graphic,
  GraphicSide,
  Section,
  SensorType,
  State,
  StatesExtended,
} from "../components/enum.data";
import { Door } from "../house-parts/door.model";
import { Measure } from "../house-parts/measure.model";
import { Wall, WallType } from "../house-parts/wall.model";
import { RoofStyle } from "../house/cross.model";
import { House } from "../house/house.model";
import { HouseService } from "../house/house.service";
import { Sensor } from "../model/specific/sensors/sensor.model";
import { AppSVG } from "../model/svg.model";

@Injectable({
  providedIn: "root",
})
export class StatesService {
  states: StateObj;
  house: House;
  silentStates: StateObj;

  states$ = new BehaviorSubject<StateObj>({});

  private section: Section; // internal as cache

  constructor(private cookieService: CookieService) {
    this.onStartReadCookie();
  }

  onStartReadCookie() {
    let statesString = this.cookieService.get("states");
    if (statesString === "") statesString = "{}";
    console.log("reading cookie", JSON.parse(statesString));
    this.states$.next(JSON.parse(statesString));
  }

  setStatesSilent(
    states: StatesExtended[],
    overrule?: boolean,
    checkCookie?: boolean
  ) {
    states.flatMap((state) =>
      this.setState(state, overrule, checkCookie, false)
    );
    console.log("setStatesSilent", this.silentStates);
  }

  hardSetStates(stateObj: StateObj) {
    console.log("hardSetStates", stateObj);

    const oldStates = this.states$.value;
    Object.entries(stateObj).forEach(([k, v]) => {
      oldStates[k] = v;
    });
    this.commitState(oldStates);
  }

  setState(
    keys: StatesExtended | StatesExtended[],
    overrule?: boolean,
    checkCookie?: boolean,
    commit = true
  ) {
    const states = this.states$.value;

    (keys instanceof Array ? keys : [keys]).flatMap((key) => {
      if (checkCookie) {
        states[key] = Boolean(this.cookieService.get("states"));
      }
      if (overrule !== undefined) {
        states[key] = overrule;
      } else {
        if (states[key] !== undefined) {
          states[key] = !states[key];
        } else {
          states[key] = true;
        }
      }
    });

    if (commit) {
      this.commitState(states);
    } else {
      this.silentStates = states;
    }
  }

  commitState(newState: StateObj) {
    // console.log("commitState", newState);

    this.states$.next(newState);
    this.cookieService.set("states", JSON.stringify(newState));
  }

  ////////////// Data based //////////////

  buildState(
    stateObj: StateObj,
    statesToEnabled: StatesExtended[],
    condition: boolean
  ) {
    statesToEnabled.forEach((state) => {
      stateObj[state] = condition;
    });
  }
  /**
   * Updates state$ once based on sections
   */
  updateStateBasedOnSection(section: Section, checkCookie) {
    if (this.section === section) return;
    this.section = section;

    const arr = { ...this.states$.value };
    this.buildState(arr, [State.grid], [Section.mainBasics].includes(section));

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
        Section.mainBasics,
        // Section.roof70,
        // Section.roofCircle,
      ].includes(section)
    );

    this.buildState(
      arr,
      [State.doors],
      ![Section.mainPassiv, Section.mainWelcome].includes(section)
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
    this.commitState(arr);
  }

  /**
   * Filter all baseSVGs
   */

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
}
