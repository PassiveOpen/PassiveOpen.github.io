import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Renderer2,
} from "@angular/core";
import { ActivatedRoute, NavigationEnd, Params, Router } from "@angular/router";
import {
  faDiscord,
  faGithub,
  faInstagram,
  faPatreon,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import {
  tap,
  filter,
  map,
  startWith,
  fromEvent,
  throttle,
  throttleTime,
} from "rxjs";
import { AppService } from "src/app/app.service";
import { RoofStyle } from "src/app/house/cross.model";
import { HouseService } from "src/app/house/house.service";
import { StateService } from "src/app/house/visible.service";
import { round } from "src/app/shared/global-functions";
import { animationFallInOut, animationSlideInOut } from "../animations";
import { Graphic, GraphicSide, State, Section, Tag } from "../enum.data";
import { TooltipService } from "../tooltip/tooltip.service";

@Component({
  selector: "app-footer",
  styleUrls: ["./footer.component.scss"],
  templateUrl: "./footer.component.html",
})
export class AppFooterComponent {
  year = new Date().getFullYear();

  discord = this.appService.discord;
  github = this.appService.github;
  youtube = this.appService.youtube;
  patreon = this.appService.patreon;
  instagram = this.appService.instagram;

  faDiscord = faDiscord;
  faGithub = faGithub;
  faYoutube = faYoutube;
  faPatreon = faPatreon;
  faInstagram = faInstagram;

  onStart = true;

  constructor(private appService: AppService, private router: Router) {}
}
