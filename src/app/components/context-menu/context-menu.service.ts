import { ComponentPortal } from "@angular/cdk/portal";
import { AppContextMenuComponent } from "./context-menu.component";
import { Injectable } from "@angular/core";
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { D3DistanceService } from "src/app/2d-svg/d3Distance.service";
import { xy } from "src/app/house/house.model";
import { take } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ContextMenuService {
  isOpen = false;
  clientXY: xy;

  click(e: PointerEvent) {
    this.clientXY = [e.clientX, e.clientY];
    this.closeMenu();
    if (this.d3Service.isDistance) {
      this.d3Service.stop();
      return;
    }
    this.createMenu();
  }
  overlayRef: OverlayRef;

  constructor(private overlay: Overlay, private d3Service: D3DistanceService) {}

  createMenu() {
    this.overlayRef = this.overlay.create({
      positionStrategy: this.positionStrategy(),
    });
    const contextPortal = new ComponentPortal(AppContextMenuComponent);
    this.overlayRef.addPanelClass("example-overlay");
    const menuRef = this.overlayRef.attach(contextPortal);
    menuRef.instance.xy = this.clientXY;

    this.isOpen = true;
  }

  closeMenu() {
    if (!this.overlayRef) return;
    this.overlayRef.detach();
    this.isOpen = false;
  }

  positionStrategy() {
    return this.overlay
      .position()
      .global()
      .left(this.clientXY[0] + "px")
      .top(this.clientXY[1] + "px");
  }
}
