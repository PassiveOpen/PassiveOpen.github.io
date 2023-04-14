import { AfterViewInit, Component } from "@angular/core";
import { Section, Tag } from "src/app/components/enum.data";

@Component({
  selector: "app-page-installation",
  templateUrl: "./page-installation.component.html",
  styleUrls: ["./page-installation.component.scss"],
})
export class PageInstallationsComponent implements AfterViewInit {
  Tag = Tag;
  Section = Section;

  constructor() {}

  ngAfterViewInit(): void {}
}
