import { AfterViewInit, Component } from "@angular/core";
import { AppService } from "src/app/app.service";
import { Section, Tag } from "src/app/components/enum.data";

@Component({
  selector: "app-page-depth-planning",
  templateUrl: "./page-depth-planning.component.html",
  styleUrls: ["./page-depth-planning.component.scss"],
})
export class PageDepthPlanningComponent implements AfterViewInit {
  Tag = Tag;
  Section = Section;

  constructor(public appService: AppService) {}

  ngAfterViewInit(): void {}

  scrollTo(element: any): void {
    const el = document.getElementById(element) as HTMLElement;
    console.log(element, el);

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  }
}
