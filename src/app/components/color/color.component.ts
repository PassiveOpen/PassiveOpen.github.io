import { AfterViewInit } from "@angular/core";
import { ViewChild } from "@angular/core";
import { Host } from "@angular/core";
import { ElementRef } from "@angular/core";
import { Component, OnInit } from "@angular/core";
import { ColorService, Color } from "./color.service";
@Component({
  selector: "color",
  styles: [":host{display: none}"],
  templateUrl: "./color.component.html",
})
export class AppColorComponent implements AfterViewInit {
  @ViewChild("primary") primary: ElementRef;

  keys = Object.values(Color);
  constructor(private colorService: ColorService, private host: ElementRef) {}

  ngAfterViewInit(): void {
    this.parseColors();
  }
  parseColors() {
    const host = this.host.nativeElement as HTMLElement;
    console.log(this.host.nativeElement);

    this.keys.forEach((key) => {
      const el = host.querySelector(`.${key}`);
      if (!el) return;
      const primaryColor = getComputedStyle(el).backgroundColor;
      console.log(
        `%c ${key}: ${primaryColor}`,
        `background: ${primaryColor}; color: ${this.invertColor(primaryColor)}`
      );
      this.colorService.color[key] = primaryColor;
    });
  }

  invertColor(rgb, bw = true) {
    function padZero(str) {
      return `${str}`.padStart(3, "0");
    }
    let [r, g, b] = rgb.replace(")", "").replace("rgb(", "").split(", ");
    if (bw) {
      // https://stackoverflow.com/a/3943023/112731
      return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? "#000000" : "#FFFFFF";
    }
    // invert color components
    r = 255 - r;
    g = 255 - g;
    b = 255 - b;
    // pad each with zeros and return
    return "#" + padZero(r) + padZero(g) + padZero(b);
  }
}
