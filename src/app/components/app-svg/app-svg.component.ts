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
  selector: "app-svg",
  templateUrl: "./app-svg.component.html",
  styleUrls: ["./app-svg.component.scss"],
})
export class AppSVGComponent implements OnInit {
  @Input() @HostBinding("style.background") background;
  @Input() @HostBinding("style.fill") fillColor;
  @Input() @HostBinding("style.height") height = `32px`;
  @Input() @HostBinding("style.width") width = `32px`;
  @Input() url;
  @Input() set color(x) {
    if (x === "primary") {
      this.fillColor = `var(--primary-color)`;
    } else if (x === "accent") {
      this.fillColor = `var(--accent-color)`;
    } else if (x === "first") {
      this.fillColor = `var(--first-color)`;
    } else if (x === "second") {
      this.fillColor = `var(--second-color)`;
    } else if (x === "third") {
      this.fillColor = `var(--third-color)`;
    } else {
      this.fillColor = `${x}`;
    }
  }
  @Input() set size(size) {
    this.width = `${size[0]}px`;
    this.height = `${size[1]}px`;
  }

  svgData;

  constructor(
    private httpClient: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // const base = "https://passiveopen.com/";
    // http://localhost:4200/assets/svg/smoke.svg
    // http://localhost:4200/assets/svg/sensor-smoke.svg
    const base = "";
    this.httpClient
      .get(`${base}${this.url}`, { responseType: "text" })
      .subscribe({
        next: (x) => {
          x = x
            .replace(/height=\"64px\"/gi, "")
            .replace(/width=\"64px\"/gi, "");
          this.svgData = this.sanitizer.bypassSecurityTrustHtml(x);
        },
        error: (e) => {
          this.background = "#aaa";
        },
      });
  }
}
