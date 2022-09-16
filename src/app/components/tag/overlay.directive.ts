/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-shadow */

import {
  Directive,
  Input,
  OnInit,
  TemplateRef,
  EventEmitter,
  Output,
  HostListener,
  ComponentRef,
  OnDestroy,
  ElementRef,
  ChangeDetectorRef,
  ViewContainerRef,
  EmbeddedViewRef,
} from '@angular/core';
import {
  ConnectionPositionPair,
  Overlay,
  OverlayRef,
} from '@angular/cdk/overlay';

import { takeUntil, tap } from 'rxjs/operators';
import { concat, fromEvent, merge, Subject } from 'rxjs';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import {
  animate,
  AnimationBuilder,
  AnimationMetadata,
  AnimationPlayer,
  style,
} from '@angular/animations';
import { environment } from 'src/environments/environment';
import { AppService } from 'src/app/app.service';
import { Tag } from '../enum.data';

@Directive({
  selector: '[overlayTemplate]',
})
export class OverlayDirective implements OnInit, OnDestroy {
  @Input() overlayTemplate: TemplateRef<any>;
  @Input() open = false;

  animate = true;
  player;
  byClick = false;

  overlayRef: OverlayRef;
  componentRef: EmbeddedViewRef<any>;
  private unsubscribe = new Subject<void>();
  pageEl: HTMLElement;
  arrowEl: HTMLElement;
  btn: HTMLElement;
  constructor(
    private builder: AnimationBuilder,
    private overlay: Overlay,
    private appService: AppService,
    private viewContainerRef: ViewContainerRef
  ) {}

  // @HostListener('window:resize')
  // resize() {
  //   this.updateOnChange();
  // }
  @HostListener('mouseover')
  mouseover() {
    this.attachOverlay();
  }

  @HostListener('mouseout')
  mouseout() {
    this.appService.popupActive$.next(false);
    this.detachOverlay();
  }
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.updateOnChange();
  }
  getPositionStrategy() {
    let positionStrategy;
    positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.viewContainerRef.element.nativeElement)
      .withPositions([
        new ConnectionPositionPair(
          { originX: 'start', originY: 'top' },
          { overlayX: 'start', overlayY: 'bottom' },
          -this.btn.getBoundingClientRect().left +
            this.pageEl.getBoundingClientRect().left +
            8,
          -20
        ),
        new ConnectionPositionPair(
          { originX: 'start', originY: 'bottom' },
          { overlayX: 'start', overlayY: 'top' },
          -this.btn.getBoundingClientRect().left +
            this.pageEl.getBoundingClientRect().left +
            8,
          20,
          'flipped'
        ),
      ])
      .withPush(true);
    return positionStrategy;
  }

  getScrollStrategy() {
    return this.overlay.scrollStrategies.reposition();
  }

  ngOnInit(): void {
    this.pageEl = document.querySelector('.center');
    this.btn = this.viewContainerRef.element.nativeElement as HTMLElement;
    const positionStrategy = this.getPositionStrategy();
    const scrollStrategy = this.getScrollStrategy();

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy,
      hasBackdrop: this.byClick,
    });

    this.overlayRef
      .backdropClick()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.detachOverlay();
      });
    if (this.open) {
      this.attachOverlay();
    }
  }

  ngOnDestroy(): void {
    this.detachOverlay();
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.overlayRef.dispose();
  }

  detachOverlay(): void {
    if (this.overlayRef && this.overlayRef.hasAttached()) {
      this.arrowEl.remove();
      this.overlayRef.detach();
    }
  }

  attachOverlay(): void {
    // console.clear();
    const portal = new TemplatePortal(
      this.overlayTemplate,
      this.viewContainerRef
    );
    if (this.overlayRef && !this.overlayRef.hasAttached()) {
      //   const portal = new ComponentPortal(OverlayComponent);
      this.componentRef = this.overlayRef.attach(portal);

      //   this.componentRef.instance.template = this.copOverlayTemplate;
      //   this.componentRef.instance.copOverlayType = this.copOverlayType;
      // if (this.animate) {
      //   const el = this.componentRef.context.nativeElement as HTMLElement;
      //   this.player = this.playAnimation(this.enterAnimation(el), el);
      // }
      //   this.updateOnChange();
      this.updateOnChange();
      this.createMakeMeAPopup();
      // } else {
      //   console.log('overlay is not known');
      this.appService.popupActive$.next(true);
    }
  }

  createMakeMeAPopup() {
    this.overlayRef.overlayElement.classList.add('popup', 'base');
    this.arrowEl = document.createElement('div');
    this.arrowEl.classList.add('popup-arrow', 'base');
    this.setArrow();
    this.overlayRef.overlayElement.append(this.arrowEl);
  }
  setArrow() {
    const { left, width } = this.btn.getBoundingClientRect();
    const { x } = this.pageEl.getBoundingClientRect();
    this.arrowEl.style.left = `${left - x - 20 + width / 2}px`;
  }

  private updateOnChange() {
    if (this.overlayRef && this.overlayRef.hasAttached()) {
      this.overlayRef.updatePosition();
      this.overlayRef.updateSize({
        width: this.pageEl.clientWidth,
      });
      if (this.arrowEl) {
        this.setArrow();
      }
    }
  }

  private playAnimation(
    animationMetaData: AnimationMetadata[],
    el
  ): AnimationPlayer {
    const animation = this.builder.build(animationMetaData);
    const player = animation.create(el);
    player.play();
    return player;
  }

  private enterAnimation(copPanelEl: HTMLElement): AnimationMetadata[] {
    copPanelEl.style.maxWidth = '100%';
    return [
      style({ 'max-width': '0%' }),
      animate('150ms ease-out', style({ 'max-width': '100%' })),
    ];
    // } else if (this.copOverlayAnimation === OverlayAnimation.scaleLeft) {
    //   copPanelEl.style.transform = 'scaleX(0)';
    //   copPanelEl.style.transformOrigin = 'left';
    //   return [animate('200ms ease-out', style({ transform: 'scaleX(1)' }))];
    // } else if (this.copOverlayAnimation === OverlayAnimation.slideTop) {
    //   copPanelEl.style.maxHeight = '100%';
    //   return [
    //     style({ 'max-height': '0%' }),
    //     animate('200ms ease-out', style({ 'max-height': '100%' })),
    //   ];
    // } else if (this.copOverlayAnimation === OverlayAnimation.fadeIn) {
    //   copPanelEl.style.opacity = '1';
    //   return [
    //     style({ opacity: 0 }),
    //     animate('200ms ease-in', style({ opacity: 1 })),
    //   ];
    // } else if (this.copOverlayAnimation === OverlayAnimation.slideUp) {
    //   copPanelEl.style.maxHeight = '100%';
    //   return [
    //     style({ transform: 'translateY(100%)' }),
    //     animate('200ms ease-out', style({ transform: 'translateY(0%)' })),
    //   ];
    // } else {
    //   copPanelEl.style.opacity = '1';
    //   return [
    //     style({ opacity: 0 }),
    //     animate('200ms ease-in', style({ opacity: 1 })),
    //   ];
    // }
  }

  private leaveAnimation(): AnimationMetadata[] {
    return [animate('200ms ease-in', style({ 'max-width': '0%' }))];
    //   } else if (this.copOverlayAnimation === OverlayAnimation.scaleLeft) {
    //     return [animate('200ms ease-in', style({ transform: 'scaleX(0.0001)' }))];
    //   } else if (this.copOverlayAnimation === OverlayAnimation.slideTop) {
    //     return [animate('200ms ease-in', style({ 'max-height': '0%' }))];
    //   } else if (this.copOverlayAnimation === OverlayAnimation.slideUp) {
    //     return [
    //       animate('200ms ease-in', style({ transform: 'translateY(100%)' })),
    //     ];
    //   } else if (this.copOverlayAnimation === OverlayAnimation.fadeIn) {
    //     return [animate('200ms ease-in', style({ opacity: 0 }))];
    //   } else {
    //     return [animate('200ms ease-in', style({ opacity: 0 }))];
    //   }
  }
}
