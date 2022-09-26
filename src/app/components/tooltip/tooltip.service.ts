import {
  ConnectionPositionPair,
  Overlay,
  OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ComponentRef, ElementRef, Injectable } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { BaseSVG } from 'src/app/model/base.model';
import { Sensor } from 'src/app/model/specific/sensors/sensor.model';
import { HouseService } from '../../house/house.service';
import { TooltipComponent } from './tooltip.component';

@Injectable({
  providedIn: 'root',
})
export class TooltipService {
  tooltipHTML$ = new BehaviorSubject<SafeHtml>(undefined);

  overlayRef: OverlayRef;
  unsubscribe = new Subject<void>();
  componentRef: ComponentRef<TooltipComponent>;
  arrowEl: HTMLElement;
  origin;

  constructor(private overlay: Overlay, private houseService: HouseService) {}

  attachPopup([x, y], obj: BaseSVG) {
    // console.clear();
    this.detachOverlay();
    this.origin = obj instanceof Sensor ? obj.svgIcon.node() : obj.svg.node();

    this.overlayRef = this.overlay.create({
      positionStrategy: this.getPositionStrategy([x, y]),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: false,
    });

    this.overlayRef
      .backdropClick()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.detachOverlay();
      });
    this.attachOverlay(obj);
  }
  detachOverlay() {
    if (this.overlayRef && this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
    }
  }
  updateOverlay() {
    // console.log(this.origin);
    // if (this.overlayRef && !this.overlayRef.hasAttached()) {
    //   this.overlayRef.updatePosition();
    // }
  }

  attachOverlay(obj: BaseSVG): void {
    if (this.overlayRef && !this.overlayRef.hasAttached()) {
      const portal = new ComponentPortal(TooltipComponent);
      this.componentRef = this.overlayRef.attach(portal);
      this.componentRef.instance.html = obj.tooltip(
        this.houseService.house$.value
      );
    }
  }
  getPositionStrategy([x, y]) {
    return this.overlay
      .position()
      .flexibleConnectedTo(this.origin)
      .withPositions([
        new ConnectionPositionPair(
          { originX: 'center', originY: 'top' },
          { overlayX: 'center', overlayY: 'bottom' },
          0,
          -20
        ),
        new ConnectionPositionPair(
          { originX: 'center', originY: 'bottom' },
          { overlayX: 'center', overlayY: 'top' },
          0,
          20,
          'flipped'
        ),
      ])
      .withPush(true);
  }
}
