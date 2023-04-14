import { Component } from "@angular/core";
import {
  faDiscord,
  faGithub,
  faInstagram,
  faPatreon,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { AppService } from "src/app/app.service";

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

  constructor(private appService: AppService) {}
}
