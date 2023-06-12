import { AfterViewInit, Component } from "@angular/core";
import { AppService } from "src/app/app.service";
import { Section, Tag } from "src/app/components/enum.data";

@Component({
  selector: "app-page-depth-rain-water",
  templateUrl: "./page-depth-rain-water.component.html",
  styleUrls: ["./page-depth-rain-water.component.scss"],
})
export class PageDepthRainWaterComponent implements AfterViewInit {
  Tag = Tag;
  Section = Section;

  constructor(public appService: AppService) {}

  ngAfterViewInit(): void {}
}
