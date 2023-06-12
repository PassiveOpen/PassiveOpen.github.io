import { AfterViewInit, Component } from "@angular/core";
import { AppService } from "src/app/app.service";
import { Section, Tag } from "src/app/components/enum.data";

@Component({
  selector: "app-page-depth-energy-warmth",
  templateUrl: "./page-depth-energy-warmth.component.html",
  styleUrls: ["./page-depth-energy-warmth.component.scss"],
})
export class PageDepthEnergyWarmthComponent implements AfterViewInit {
  Tag = Tag;
  Section = Section;

  constructor(public appService: AppService) {}

  ngAfterViewInit(): void {}

  state() {
    this.appService;
  }
}
