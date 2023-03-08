import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  Renderer2,
} from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { faDiscord, faGithub } from "@fortawesome/free-brands-svg-icons";
import { distinct, filter, map } from "rxjs";
import { AppService } from "./app.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, AfterViewInit {
  onStart = true;

  constructor(private appService: AppService, private router: Router) {}

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
