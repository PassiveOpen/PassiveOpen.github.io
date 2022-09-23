import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  Renderer2,
} from "@angular/core";
import { faDiscord, faGithub } from "@fortawesome/free-brands-svg-icons";
import { AppService } from "./app.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, AfterViewInit {
  year = new Date().getFullYear();
  discord = this.appService.discord;
  github = this.appService.github;

  faDiscord = faDiscord;
  faGithub = faGithub;

  constructor(private appService: AppService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {}
}
