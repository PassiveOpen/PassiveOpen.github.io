import { HttpClient, HttpHeaders } from "@angular/common/http";
import {
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  OnInit,
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: "app-img-youtube",
  templateUrl: "./img-youtube.component.html",
  styleUrls: ["./img-youtube.component.scss"],
})
export class AppYoutubeComponent implements OnInit {
  @Input() set url(url) {
    this.href = url;
    this.id = url.split("v=")[1].split("&")[0];
  }
  href;
  id;

  constructor(
    private httpClient: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {}
}
