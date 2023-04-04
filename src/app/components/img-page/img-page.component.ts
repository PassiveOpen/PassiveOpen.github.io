import { AfterViewInit, Component, Input } from "@angular/core";

@Component({
  selector: "app-img-page",
  styleUrls: ["./img-page.component.scss"],
  templateUrl: "./img-page.component.html",
})
export class AppImgPageComponent implements AfterViewInit {
  @Input() src: string;
  @Input() height: string;

  ngAfterViewInit(): void {}
}
