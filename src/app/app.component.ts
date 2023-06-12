import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  Renderer2,
} from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { distinct, filter, map } from "rxjs";
import { AppService } from "./app.service";
import { MatIconRegistry } from "@angular/material/icon";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, AfterViewInit {
  onStart = true;

  constructor(private router: Router, private iconRegistry: MatIconRegistry) {
    this.iconRegistry.setDefaultFontSetClass("material-symbols-outlined");
  }

  //@ts-ignore
  isMobile = navigator.userAgentData.mobile;
  readMobile = false;

  ngOnInit() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map((e) => e.urlAfterRedirects.split("?")[0]),
        distinct()
      )
      .subscribe((evt) => {
        if (this.onStart) {
          this.onStart = false;
          return;
        }
        window.scrollTo(0, 0);
      });
  }
  ngAfterViewInit(): void {}
}
