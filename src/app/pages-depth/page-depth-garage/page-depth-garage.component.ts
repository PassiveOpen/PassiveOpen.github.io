import { AfterViewInit, Component } from "@angular/core";
import { Section, Tag } from "src/app/components/enum.data";
import { Garage } from "src/app/house/garage.model";
import { HouseService } from "src/app/house/house.service";

@Component({
  selector: "app-page-depth-garage",
  templateUrl: "./page-depth-garage.component.html",
  styleUrls: ["./page-depth-garage.component.scss"],
})
export class PageDepthGarageComponent implements AfterViewInit {
  Tag = Tag;
  Section = Section;
  house$ = this.houseService.house$;

  garage: Garage = {};

  constructor(private houseService: HouseService) {}

  ngAfterViewInit(): void {
    this.garage = this.houseService.house$.value.garage;
  }
}
