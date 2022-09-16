import { AfterViewInit, Component, HostListener } from '@angular/core';
import { AppService } from 'src/app/app.service';
import { Section, Tag } from 'src/app/components/enum.data';
import { RoofStyle } from 'src/app/house/cross.model';
import { House } from 'src/app/house/house.model';
import { HouseService } from 'src/app/house/house.service';

@Component({
  selector: 'app-page-house',
  templateUrl: './page-house.component.html',
  styleUrls: ['./page-house.component.scss'],
})
export class PageHouseComponent implements AfterViewInit {
  house$ = this.houseService.house$;
  Section = Section;
  tags = Tag;
  RoofStyle = RoofStyle;

  update = this.houseService.update;
  constructor(
    private houseService: HouseService,
    private appService: AppService
  ) {}


  ngAfterViewInit(): void {
  }

  studLabel(value) {
    return `#${value} `;
  }
  sizeLabel(value) {
    return `${value} m`;
  }
  choosenRoofstyle(roofStyle) {
    this.houseService.update('cross', 'roofStyle', roofStyle);
  }
}
