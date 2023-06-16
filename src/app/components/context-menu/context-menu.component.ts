import { Component, ElementRef, OnInit } from "@angular/core";

import { AppService } from "src/app/app.service";
import { xy } from "src/app/house/house.model";
import { D3DistanceService } from "src/app/2d-svg/d3Distance.service";
import { ContextMenuService } from "./context-menu.service";

@Component({
  selector: "context-menu",
  templateUrl: "./context-menu.component.html",
  styleUrls: ["./context-menu.component.scss"],
})
export class AppContextMenuComponent implements OnInit {
  xy: xy;

  constructor(
    public appService: AppService,
    public d3DistanceService: D3DistanceService,
    public contextMenuService: ContextMenuService
  ) {}

  ngOnInit(): void {}

  measure() {
    this.d3DistanceService.start();
    this.contextMenuService.closeMenu();
  }
  whatIsHere() {
    this.contextMenuService.closeMenu();
    const [x, y] = this.xy;
    const event = new MouseEvent("click", {
      clientX: x,
      clientY: y,
      bubbles: true,
    });
    const el = document.elementFromPoint(x, y) as any;
    el.dispatchEvent(event);
  }
}
