import { AfterViewInit, Component, HostListener } from "@angular/core";
import { AppService } from "src/app/app.service";
import { Section, Tag } from "src/app/components/enum.data";
import { RoofStyle } from "src/app/house/cross.model";
import { House } from "src/app/house/house.model";
import { HouseService } from "src/app/house/house.service";
import { round } from "src/app/shared/global-functions";
import { faDiscord, faGithub } from "@fortawesome/free-brands-svg-icons";

@Component({
  selector: "app-page-about",
  templateUrl: "./page-about.component.html",
  styleUrls: ["./page-about.component.scss"],
})
export class PageAboutComponent {
  discord = this.appService.discord;
  github = this.appService.github;
  faDiscord = faDiscord;
  faGithub = faGithub;

  constructor(
    private houseService: HouseService,
    private appService: AppService
  ) {}
}
