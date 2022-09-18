import { Component, HostBinding, OnInit } from '@angular/core';
import { AppService } from 'src/app/app.service';

@Component({
  selector: 'app-sidemenu',
  templateUrl: './sidemenu.component.html',
  styleUrls: ['./sidemenu.component.scss'],
})
export class SideMenuComponent implements OnInit {
  @HostBinding('class.mini') mini = false;
  @HostBinding('class.collapsed') collapsed = true;

  title = this.appService.title;

  constructor(private appService: AppService) {}

  open() {
    if (this.mini) {
      this.collapsed = false;
    }
    this.mini = !this.mini;
  }
  click() {
    this.collapsed = true;
  }
  ngOnInit(): void {}
  get darkMode() {
    return this.appService.darkMode;
  }
  set darkMode(x) {
    this.appService.setDarkMode(x, true);
  }
}
