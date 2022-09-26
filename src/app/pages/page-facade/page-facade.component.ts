import { AfterViewInit, Component } from "@angular/core";
import { Subscription } from "rxjs";
import { AppService } from "src/app/app.service";
import { Section, Tag } from "src/app/components/enum.data";
import { HouseService } from "src/app/house/house.service";
import { ThreeService } from "../../3d/three-window.service";

@Component({
  selector: "app-page-facade",
  templateUrl: "./page-facade.component.html",
  styleUrls: ["./page-facade.component.scss"],
})
export class PageFacadeComponent implements AfterViewInit {
  house$ = this.houseService.house$;

  Section = Section;
  Tag = Tag;

  wallDetail = "wallDetail";
  subscriptions: Subscription[] = [];

  constructor(
    private houseService: HouseService,
    private threeService: ThreeService,
    private appService: AppService
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
  ngAfterViewInit(): void {
    this.subscriptions.push(...[]);
  }

  showPerSection() {}
}
