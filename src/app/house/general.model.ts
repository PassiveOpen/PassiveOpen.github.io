import { Subject } from "rxjs";
import { House } from "./house.model";

export class HouseSubPart {
  house: House;

  onHouseUpdate() {}
  onInit() {}

  houseUpdate(house: House) {
    this.house = house;
    this.onHouseUpdate();
  }
}
