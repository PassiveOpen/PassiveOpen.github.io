import { Component, ElementRef, OnInit } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { AppService } from 'src/app/app.service';
import { HouseService } from 'src/app/house/house.service';
import { animationSlideInOut } from '../animations';
import { Floor, Graphic, State } from '../enum.data';

@Component({
  selector: 'controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.scss'],
  animations: [animationSlideInOut],
})
export class ControlsComponent implements OnInit {
  house$ = this.houseService.house$;
  Floor = Floor;
  floor$ = this.appService.floor$;
  scroll$ = this.appService.scroll$;
  states$ = this.appService.states$;
  setFloor = () => this.appService.setFloor();
  Graphic = Graphic;
  States = State;

  extra = true;

  setStates = this.appService.setStates;

  get fullscreen() {
    return this.appService.fullscreen$.value;
  }
  set fullscreen(state) {
    this.cookieService.set('fullscreen', `${state}`);
    this.appService.fullscreen$.next(state);
  }
  constructor(
    private appService: AppService,
    private elementRef: ElementRef,
    private houseService: HouseService,
    private cookieService: CookieService
  ) {}

  ngOnInit(): void {}
}
