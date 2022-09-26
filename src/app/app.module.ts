import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

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
import { ThreeWindowComponent } from "./pages/page-construction/three-window/three-window.component";
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

@NgModule({
  declarations: [
    AppComponent,
    SideMenuComponent,
    ThreeWindowComponent,
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
    PageMapComponent,
    PageFacadeComponent,
    PageCostsComponent,
    TooltipComponent,
    OverlayDirective,
    ControlsComponent,
    AppMainPageComponent,
    SafeHtmlPipe,
    AppTableComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MaterialModule,
    FlexLayoutModule,
    HttpClientModule,
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
