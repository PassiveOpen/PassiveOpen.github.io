import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { OverlayModule } from "@angular/cdk/overlay";

import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MaterialModule } from "./mat.module";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TagComponent } from "./components/tag/tag.component";
import { TooltipComponent } from "./components/tooltip/tooltip.component";
import { HttpClientModule } from "@angular/common/http";
import { OverlayDirective } from "./components/tag/overlay.directive";
import { RouterModule, Routes } from "@angular/router";
import { SideMenuComponent } from "./components/sidemenu/sidemenu.component";
import { PageMapComponent } from "./pages/page-map/page-map.component";
import { ControlsComponent } from "./components/controls/controls.component";
import { AppMainPageComponent } from "./components/main-page/main-page.component";
import { PageHouseComponent } from "./pages/page-house/page-house.component";
import { PageStairsComponent } from "./pages/page-stairs/page-stairs.component";
import { PageFacadeComponent } from "./pages/page-facade/page-facade.component";
import { MatIconRegistry } from "@angular/material/icon";
import { CookieService } from "ngx-cookie-service";
import { DisqusModule } from "ngx-disqus";
import { NgxGoogleAnalyticsModule } from "ngx-google-analytics";
import { PageInstallationsComponent } from "./pages/page-installation/page-installation.component";
import { PageConstructionComponent } from "./pages/page-construction/page-construction.component";
import { PageWiredComponent } from "./pages/page-wired/page-wired.component";
import { routes } from "./app.router";

import { SvgStairsComponent } from "./svg/svg-stair-steps/svg-stair-steps.component";
import { SvgStairPlanComponent } from "./svg/svg-stair-plan/svg-stair-plan.component";
import { SvgComponent } from "./svg/svg-house-plan/svg-plan.component";
import { SvgCrossComponent } from "./svg/svg-house-cross/svg-cross.component";
import { AppSVGComponent } from "./components/app-svg/app-svg.component";
import { AppTableComponent } from "./components/table/table.component";
import { PageCostsComponent } from "./pages/page-costs/page-costs.component";
import { SafeHtmlPipe } from "./shared/safehtml.pipe";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { PageAboutComponent } from "./pages/page-about/page-about.component";
import { ThreeConstructionComponent } from "./3d/three-construction/three-construction.component";
import { AppContextMenuComponent } from "./components/context-menu/context-menu.component";
import { Page3dHouseComponent } from "./pages/page-3d-house/page-3d-house.component";
import { ThreeHouseComponent } from "./3d/three-house/three-house.component";
import { BaseThreeComponent } from "./3d/base-three.component";

@NgModule({
  declarations: [
    AppComponent,
    SideMenuComponent,
    ThreeConstructionComponent,
    ThreeHouseComponent,
    AppSVGComponent,
    SvgComponent,
    SvgCrossComponent,
    SvgStairsComponent,
    SvgStairPlanComponent,
    TagComponent,
    PageHouseComponent,
    PageStairsComponent,
    PageInstallationsComponent,
    PageAboutComponent,
    PageConstructionComponent,
    PageWiredComponent,
    PageCostsComponent,
    Page3dHouseComponent,
    PageMapComponent,
    PageFacadeComponent,
    PageCostsComponent,
    BaseThreeComponent,
    TooltipComponent,
    OverlayDirective,
    ControlsComponent,
    AppMainPageComponent,
    SafeHtmlPipe,
    AppTableComponent,
    AppContextMenuComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MaterialModule,
    FlexLayoutModule,
    HttpClientModule,
    OverlayModule,
    FontAwesomeModule,
    DisqusModule.forRoot("passiv"),
    NgxGoogleAnalyticsModule.forRoot("G-W580DX5P7G"),
    RouterModule.forRoot(routes, {
      anchorScrolling: "enabled",
      // onSameUrlNavigation: "reload",
      // scrollPositionRestoration: "enabled",
    }),
  ],
  providers: [CookieService],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(iconRegistry: MatIconRegistry) {
    iconRegistry.addSvgIconSet("material-icons-outlined");
  }
}
