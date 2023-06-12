import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  OnInit,
  ViewChild,
} from "@angular/core";
import { MatButton } from "@angular/material/button";
import { AppService } from "src/app/app.service";
import packageJson from "../../../../package.json";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-sidemenu",
  templateUrl: "./sidemenu.component.html",
  styleUrls: ["./sidemenu.component.scss"],
})
export class SideMenuComponent implements AfterViewInit {
  version: string = packageJson.version;
  title = this.appService.title;
  @ViewChild("menu", { read: ElementRef }) menu: ElementRef;

  private = !environment.production;
  constructor(private appService: AppService) {}

  ngAfterViewInit(): void {
    // this.menu.nativeElement.click();
  }

  click() {}

  get darkMode() {
    return this.appService.darkMode;
  }
  set darkMode(x) {
    this.appService.setDarkMode(x, true);
  }
}
