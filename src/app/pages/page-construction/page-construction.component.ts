import { AfterViewInit, Component, NgZone } from '@angular/core';
import { AppService } from 'src/app/app.service';
import { HouseService } from 'src/app/house/house.service';
import { Section, Tag } from 'src/app/components/enum.data';

@Component({
  selector: 'app-page-construction',
  templateUrl: './page-construction.component.html',
  styleUrls: ['./page-construction.component.scss'],
})
export class PageConstructionComponent implements AfterViewInit {
  Tag = Tag;
  Section = Section;
  constructor(
    private zone: NgZone,
    private appService: AppService,
    private houseService: HouseService
  ) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => this.initMap());
  }

  initMap() {}
}
