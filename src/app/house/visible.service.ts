import { Injectable } from '@angular/core';
import { House } from './house.model';
import { State } from '../components/enum.data';
import { AppService } from '../app.service';
import { HouseService } from './house.service';
import { Measure } from '../model/specific/measure.model';
import { Cross } from './cross.model';
import { Wall, WallType } from '../model/specific/wall.model';
import { Door } from '../model/specific/door.model';

@Injectable({
  providedIn: 'root',
})
export class VisibleService {
  states: State[];
  house: House;
  cross: Cross;

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

  filterOut() {
    //// ========== towerFootprint ==========
    this.house.tower.footprintVisible = this.states.includes(
      State.towerFootprint
    );

    //// ========== Theoretical walls ==========
    this.house.partsFlatten
      .filter((x) => x instanceof Door)
      .forEach(
        (x) => (x.visible = this.states.includes(State.doors))
      );


    //// ========== Theoretical walls ==========
    this.house.partsFlatten
      .filter((x) => x instanceof Wall)
      .filter((x: Wall) => x.type === WallType.theoretic)
      .forEach(
        (x) => (x.visible = this.states.includes(State.theoreticalWalls))
      );

    //// ========== Measures ==========
    [...this.house.parts, ...this.cross.parts]
      .filter((x) => x instanceof Measure)
      .forEach((x) => (x.visible = this.states.includes(State.measure)));

    //// ========== Stramien ==========
    this.house.parts
      .filter((x) => x.selector.includes('house-stramien-'))
      .forEach((x) => {
        x.visible = this.states.includes(State.stramien);
      });

    //// ========== Grid ==========
    this.house.parts
      .filter((x) => x.selector.includes('grid-index'))
      .forEach((x) => {
        x.visible = this.states.includes(State.grid);
      });
  }
}
