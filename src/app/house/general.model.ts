import { Subject } from "rxjs";
import { House } from "./house.model";

export interface onHouseUpdate {
  onHouseUpdate(): void;
  onInit(): void;
}

export class HouseSubPart {
  house: House;

  onHouseUpdate() {}
  onInit() {}

  houseUpdate(house: House) {
    this.house = house;
    this.onHouseUpdate();
  }
}
