import { AfterViewInit, Component, HostListener } from "@angular/core";
import { AppService } from "src/app/app.service";
import { Section, Tag } from "src/app/components/enum.data";
import { RoofLength, RoofStyle } from "src/app/house/cross.model";
import { House } from "src/app/house/house.model";
import { HouseService } from "src/app/house/house.service";
import { round } from "src/app/shared/global-functions";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";

@Component({
  selector: "app-page-house",
  templateUrl: "./page-house.component.html",
  styleUrls: ["./page-house.component.scss"],
})
export class PageHouseComponent implements AfterViewInit {
  house$ = this.houseService.house$;
  Section = Section;
  tags = Tag;
  RoofStyle = RoofStyle;
  discord = this.appService.discord;
  faDiscord = faDiscord;
  round = round;
  update = this.houseService.update;

  RoofLength = RoofLength;

  constructor(
    private houseService: HouseService,
    private appService: AppService
  ) {}

  ngAfterViewInit(): void {
    console.log(this.house$.value);
  }

  studLabel(value) {
    return `#${value} `;
  }
  sizeLabel(value) {
    return `${value} m`;
  }
  choosenRoofstyle(roofStyle) {
    this.houseService.update("cross", "roofStyle", roofStyle);
  }
}
