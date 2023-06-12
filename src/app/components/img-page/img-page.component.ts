import { AfterViewInit, Component, Input } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: "app-img-page",
  styleUrls: ["./img-page.component.scss"],
  templateUrl: "./img-page.component.html",
})
export class AppImgPageComponent implements AfterViewInit {
  @Input() src: string;
  @Input() height: string = "360";
  @Input() imgStyle: string = "";
  style;

  constructor(private domSanitizer: DomSanitizer) {}

  newStyle = "background-color:red";

  ngAfterViewInit(): void {
    const styleString = `${this.imgStyle}height: ${this.height.replace(
      "px",
      ""
    )}px;`;
    const style = this.domSanitizer.bypassSecurityTrustStyle(styleString);
    this.style = style;
  }
}
