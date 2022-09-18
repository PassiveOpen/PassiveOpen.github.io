import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, merge, Subject } from 'rxjs';
import { House } from './house.model';
import * as d3 from 'd3';
import { lindeLund } from './lindelund/lindeLund';
import { Wall, WallSide, WallType } from '../model/specific/wall.model';
import { SensorType, State, Tag } from '../components/enum.data';
import { AppService } from '../app.service';
import { BaseSVG } from '../model/base.model';
import { Room } from '../model/specific/room.model';
import { Door } from '../model/specific/door.model';
import { Sensor } from '../model/specific/sensor.model';
import { Window } from '../model/specific/window.model';
import { round, sum } from '../shared/global-functions';
import { generateUUID } from 'three/src/math/MathUtils';
import { Cost, GroupRow } from './cost.model';
import { Measure } from '../model/specific/measure.model';

@Injectable({
  providedIn: 'root',
})
export class HouseService {
  house$ = new BehaviorSubject(new House(lindeLund));

  timeout;

  roomKeys = this.house$.value.partsFlatten
    .filter((x) => x instanceof Room)
    .map((x) => x.selector);

  wallKeys = this.house$.value.partsFlatten
    .filter((x) => x instanceof Wall)
    .map((x) => x.selector);

  // doorKeys = [];
  doorKeys = this.house$.value.partsFlatten
    .filter((x) => x instanceof Door)
    .map((x) => x.selector);

  // windowKeys = [];
  windowKeys = this.house$.value.partsFlatten
    .filter((x) => x instanceof Window)
    .map((x) => x.selector);

  // sensorKeys = [];
  sensorKeys = this.house$.value.partsFlatten
    .filter((x) => x instanceof Sensor)
    .map((x) => x.selector)
    .sort((a, b) => a.localeCompare(b));

  constructor(private appService: AppService) {}

  /**
   * Updates after a value change.
   */
  update(
    parent: 'cross' | 'stair' | 'house' = 'house',
    key,
    value,
    tag: Tag = undefined
  ) {
    // console.log('updates');

    const house: House = this.house$.value;

    if (parent === 'house') {
      house[key] = value;
    }
    if (parent === 'stair') {
      house.stair[key] = value;
    }
    if (parent === 'cross') {
      house.cross[key] = value;
    }
    house.calculateHouse();
    house.calculateStats();
    this.house$.next(house);

    if (tag === undefined) {
      return;
    }
    this.appService.tag$.next(tag);
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.appService.tag$.next(undefined);
    }, 600);
  }

  destroyParts() {
    const loop = (parent) => {
      parent.parts.forEach(async (baseSVG: BaseSVG) => {
        baseSVG.svg = undefined;
        if (baseSVG.parts !== undefined) loop(baseSVG);
      });
    };

    // loop(this, this);
    // loop(this.cross, this.cross);
    // loop(this.stair, this.stair);
    // const loop = (parts) => {
    //   Object.entries(parts).forEach(([selector, part]: [string, any]) => {
    //     if ('newData' in part) {
    //       part.svg = undefined;
    //         loop(part.parts);
    //       }
    //     }
    //   });
    // };

    const house = this.house$.value;
    loop(house);
    loop(house.cross);
    loop(house.stair);
  }

  getGroups(sensorType: SensorType) {
    const house = this.house$.value;
    return [
      ...new Set(
        Object.values(house.partsFlatten)
          .filter((x) => x instanceof Sensor)
          .filter((x: Sensor<any>) => x.sensorType === sensorType)
          .map((x: Sensor<any>) => x.group)
      ),
    ]
      .filter((x) => x)
      .sort((a, b) => a - b);
  }

  getOutlets(sensorType: SensorType) {
    const house = this.house$.value;
    return round(
      1,
      Object.values(house.partsFlatten)
        .filter((x) => x instanceof Sensor)
        .filter((x: Sensor<any>) => x.sensorType === sensorType)
        .map((x: Sensor<any>) => x.amount)
        .reduce((a, b) => a + b, 0)
    );
  }

  getCable(sensorType: SensorType, decimals = 1) {
    const house = this.house$.value;
    return round(
      decimals,
      Object.values(house.partsFlatten)
        .filter((x) => x instanceof Sensor)
        .filter((x: Sensor<any>) => x.sensorType === sensorType)
        .map((x: Sensor<any>) => x.cableLength)
        .reduce((a, b) => a + b, 0)
    );
  }

  getWallLength() {
    const house = this.house$.value;

    const innerLength = Math.ceil(
      sum(
        Object.values(house.partsFlatten)
          .filter((x) => x instanceof Wall)
          .map((x: Wall) => {
            let l = 0;
            if (x.type === WallType.inner) l += x.getLength(WallSide.out);
            l += x.getLength(WallSide.in);
            return l;
          })
      )
    );

    const outerLength = Math.ceil(
      sum(
        Object.values(house.partsFlatten)
          .filter((x) => x instanceof Wall)
          .filter((x: Wall) => x.type === WallType.outer)
          .map((x: Wall) => x.getLength(WallSide.out)),
        1
      )
    );

    return {
      innerLength,
      outerLength,
    };
  }

  getWallArea() {
    const house = this.house$.value;

    const innerArea = Math.ceil(
      sum(
        Object.values(house.partsFlatten)
          .filter((x) => x instanceof Wall)
          .map((x: Wall) => {
            let l = 0;
            if (x.type === WallType.inner) l += x.getArea(WallSide.out);
            l += x.getArea(WallSide.in);
            return l;
          })
      )
    );

    const outerArea = Math.ceil(
      sum(
        Object.values(house.partsFlatten)
          .filter((x) => x instanceof Wall)
          .filter((x: Wall) => x.type === WallType.outer)
          .map((x: Wall) => x.getArea(WallSide.out)),
        1
      )
    );

    return {
      innerArea,
      outerArea,
    };
  }

  getT<T>(
    type,
    keys: (keyof T)[],
    callback: (key: T) => Partial<Cost>,
    filterCallback: (key: T) => boolean = () => true,
    count = true
  ) {
    const uuid = generateUUID();
    const parts = Object.values(
      this.house$.value.partsFlatten
        .filter((x) => x instanceof (type as any))
        .filter((x) => filterCallback(x as any))
        .reduce((accumulator, value: BaseSVG) => {
          const key = keys.map((x) => `${value[x as any]}`).join(',');
          if (!(key in accumulator)) {
            accumulator[key] = {
              count: 0,
              part: value,
            };
          }
          if (type === Sensor && !count) {
            accumulator[key].count += (value as Sensor<any>).getLength();
          } else {
            accumulator[key].count += 1;
          }
          return accumulator;
        }, {})
    ).map((counter: { count: number; part: T }) => {
      const cost = new Cost(callback(counter.part));

      cost.amount = round(1, counter.count);
      cost.uuid = uuid;
      return cost;
    });

    if (parts.length > 1) {
      const groupRow = new GroupRow({
        uuid,
        name: `${parts[0].name}`,
        costs: parts,
      });
      groupRow[parts[0].name] = false;
      return groupRow;
    } else {
      if (!parts[0]) return undefined;
      const row = parts[0];
      row.uuid = undefined;
      return row;
    }
  }
}
