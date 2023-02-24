import { Routes } from "@angular/router";
import { AppMainPageComponent } from "./components/main-page/main-page.component";
import { PageHouseComponent } from "./pages/page-house/page-house.component";
import { PageStairsComponent } from "./pages/page-stairs/page-stairs.component";
import { PageConstructionComponent } from "./pages/page-construction/page-construction.component";
import { PageFacadeComponent } from "./pages/page-facade/page-facade.component";
import { PageInstallationsComponent } from "./pages/page-installation/page-installation.component";
import { PageMapComponent } from "./pages/page-map/page-map.component";
import { PageWiredComponent } from "./pages/page-wired/page-wired.component";
import { PageCostsComponent } from "./pages/page-costs/page-costs.component";
import { PageAboutComponent } from "./pages/page-about/page-about.component";
import { Page3dHouseComponent } from "./pages/page-3d-house/page-3d-house.component";
import { PagePlanningComponent } from "./pages/page-planning/page-planning.component";

export const routes: Routes = [
  { path: "map", component: PageMapComponent },
  { path: "costs", component: PageCostsComponent },
  { path: "about", component: PageAboutComponent },
  { path: "planning", component: PagePlanningComponent },
  {
    path: "",
    component: AppMainPageComponent,
    children: [
      { path: "house", component: PageHouseComponent },
      { path: "stairs", component: PageStairsComponent },
      { path: "facade", component: PageFacadeComponent },
      { path: "installations", component: PageInstallationsComponent },
      { path: "construction", component: PageConstructionComponent },
      { path: "house3d", component: Page3dHouseComponent },
      { path: "wired", component: PageWiredComponent },
    ],
  },
  { path: "**", redirectTo: "", pathMatch: "full" },
];
