import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  OnDestroy,
  ViewChild,
} from "@angular/core";
import gsap from "gsap";
import { BehaviorSubject, Subscription, throttleTime } from "rxjs";
import { AppService } from "src/app/app.service";
import { Section, Tag } from "src/app/components/enum.data";
import { HouseService } from "src/app/house/house.service";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ThreeService } from "../../../3d/three-window.service";

export enum ModelParts {
  OSB = "OSB",
  Insulation = "Insulation",
  construction = "construction",
  drywall = "drywall",
  serviceStuds = "serviceStuds",
  tapes = "tapes",
  floorBeam = "floorBeam",
}

@Component({
  selector: "app-three-window",
  templateUrl: "./three-window.component.html",
  styleUrls: ["./three-window.component.scss"],
})
export class ThreeWindowComponent implements AfterViewInit, OnDestroy {
  @ViewChild("rendererContainer") rendererContainer: ElementRef;
  resize$ = new BehaviorSubject(undefined);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  scene = new THREE.Scene();
  controls: OrbitControls;
  camera: THREE.PerspectiveCamera;

  subscriptions: Subscription[] = [];
  observer: ResizeObserver;

  modelName = "wallDetail";
  model: THREE.Scene;

  section: Section;
  tag: Tag;

  subModels: { [key in ModelParts]?: THREE.Mesh[] } = {};
  showingSubModels: { [key in ModelParts]: boolean } = {
    [ModelParts.OSB]: false,
    [ModelParts.Insulation]: false,
    [ModelParts.construction]: false,
    [ModelParts.drywall]: false,
    [ModelParts.serviceStuds]: false,
    [ModelParts.tapes]: false,
    [ModelParts.floorBeam]: false,
  };

  constructor(
    private threeService: ThreeService,
    private houseService: HouseService,
    private host: ElementRef,
    private appService: AppService
  ) {}

  onResize(): void {
    const bbox = this.host.nativeElement.getBoundingClientRect();
    const height = bbox.height;
    const width = bbox.width;

    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.setSize(width, height);
    if (this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  animate(): void {
    window.requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  createSceneAndCamera(): void {
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    this.camera.position.set(0, 1.7, 10);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = 50;
    this.controls.update();

    this.scene.background = null;
    this.renderer.shadowMap.enabled = true;
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);
    this.animate();
  }

  //// LifeCicle ////

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.observer.unobserve(this.host.nativeElement);
  }

  ngAfterViewInit(): void {
    this.createSceneAndCamera();

    // resize
    this.observer = new ResizeObserver((x) => this.resize$.next(x));
    this.observer.observe(this.host.nativeElement);
    this.subscriptions.push(
      ...[
        this.resize$.subscribe(() => {
          this.onResize();
        }),
        this.appService.fullscreen$.subscribe((fullscreen) => {
          this.onResize();
          this.controls.enableZoom = fullscreen;
        }),
        this.appService.tag$.subscribe(() => {
          this.tag = this.appService.tag$.value;
          this.sectionShowing();
        }),
        this.appService.scroll$.subscribe(() => {
          const scroll = this.appService.scroll$.value;
          if (this.section !== scroll.section) {
            this.section = scroll.section;
            this.sectionShowing();
          }
        }),
      ]
    );

    this.threeService.basicGround(this.scene);
    this.threeService.lights(this.scene);
    this.threeService.import(
      this.scene,
      this.modelName,
      (model: THREE.Scene) => {
        this.model = model;
        this.model.children.forEach((mesh: THREE.Mesh) => {
          mesh.userData["position"] = mesh.position.clone();
          (mesh.material as THREE.MeshBasicMaterial).transparent = true;
        });
        this.setSubModels();
        this.sectionShowing(true);
        console.log("Complete model:", model);
      }
    );
  }
  setSubModels() {
    this.subModels[ModelParts.Insulation] = this.model.children.filter(
      (mesh) => {
        const name = mesh.name.toLocaleLowerCase();
        return name.includes("iso") || name.includes("iso");
      }
    ) as THREE.Mesh[];

    this.subModels[ModelParts.OSB] = this.model.children.filter((mesh) =>
      mesh.name.toLocaleLowerCase().includes("g-__")
    ) as THREE.Mesh[];

    this.subModels[ModelParts.construction] = this.model.children.filter(
      (mesh) => {
        const name = mesh.name.toLocaleLowerCase();
        return name.includes("joist") || name.includes("stud");
      }
    ) as THREE.Mesh[];

    this.subModels[ModelParts.drywall] = this.model.children.filter((mesh) =>
      mesh.name.toLocaleLowerCase().includes("gips")
    ) as THREE.Mesh[];

    this.subModels[ModelParts.serviceStuds] = this.model.children.filter(
      (mesh) => mesh.name.toLocaleLowerCase().includes("service")
    ) as THREE.Mesh[];
  }

  sectionShowing(skipAnimation = false) {
    if (!this.model) {
      return;
    }
    // console.log(this.section, this.subModels);

    if ([Section.constructionFoundation].includes(this.section)) {
      this.showingSubModels = {
        [ModelParts.Insulation]: false,
        [ModelParts.OSB]: false,
        [ModelParts.construction]: true,
        [ModelParts.drywall]: false,
        [ModelParts.floorBeam]: false,
        [ModelParts.serviceStuds]: false,
        [ModelParts.tapes]: false,
      };
    }

    if ([Section.constructionCrawlerSpace].includes(this.section)) {
      this.showingSubModels = {
        [ModelParts.Insulation]: false,
        [ModelParts.OSB]: true,
        [ModelParts.construction]: true,
        [ModelParts.drywall]: false,
        [ModelParts.floorBeam]: false,
        [ModelParts.serviceStuds]: false,
        [ModelParts.tapes]: false,
      };
    }

    if ([Section.facadeDoor].includes(this.section)) {
      this.showingSubModels = {
        [ModelParts.Insulation]: true,
        [ModelParts.OSB]: true,
        [ModelParts.construction]: true,
        [ModelParts.drywall]: false,
        [ModelParts.floorBeam]: false,
        [ModelParts.serviceStuds]: false,
        [ModelParts.tapes]: false,
      };
    }

    this.toggleInsulation();
    this.toggleOSB();
    this.toggleConstruction();
  }
  toggleConstruction() {
    const model = this.subModels[ModelParts.Insulation];
    if (!model) {
      return;
    }
    const show = this.showingSubModels[ModelParts.Insulation];
    model.forEach((mesh: THREE.Mesh) => {
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const pos = mesh.userData["position"];

      if (show) {
        gsap.to(mat, {
          opacity: 1,
          duration: 1,
          ease: "power1.out",
        });
        console.log(mesh.position.y, pos.y);

        if (mesh.position.y !== pos.y) {
          gsap.fromTo(
            mesh.position,
            {
              y: mesh.position.y - 3,
            },
            {
              y: pos.y,
              duration: 1,
              ease: "power1.out",
            }
          );
        }
      } else {
        gsap.to(mat, {
          opacity: 0,
          duration: 0.3,
          ease: "power1.out",
        });
      }
    });
  }
  toggleInsulation() {
    const model = this.subModels[ModelParts.Insulation];
    if (!model) {
      return;
    }
    const show = this.showingSubModels[ModelParts.Insulation];
    model.forEach((mesh: THREE.Mesh) => {
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const pos = mesh.userData["position"];

      if (show) {
        gsap.to(mat, {
          opacity: 1,
          duration: 1,
          ease: "power1.out",
        });
        // console.log(mesh.position.y, pos.y);

        if (mesh.position.y !== pos.y) {
          gsap.fromTo(
            mesh.position,
            {
              y: mesh.position.y - 3,
            },
            {
              y: pos.y,
              duration: 1,
              ease: "power1.out",
            }
          );
        }
      } else {
        gsap.to(mat, {
          opacity: 0,
          duration: 0.3,
          ease: "power1.out",
        });
      }
    });
  }
  toggleOSB() {
    const model = this.subModels[ModelParts.OSB];
    const show = this.showingSubModels[ModelParts.OSB];
    if (!(model && show)) {
      return;
    }
    model.forEach((mesh: THREE.Mesh) => {
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const pos = mesh.userData["position"];
      mat.transparent = true;

      console.log(mesh);
      if (show) {
        gsap.fromTo(
          mat,
          {
            opacity: 1,
          },
          {
            opacity: 0,
            duration: 0.3,
            ease: "power1.out",
          }
        );
      } else {
        gsap.fromTo(
          mat,
          {
            opacity: 0,
          },
          {
            opacity: 1,
            duration: 1,
            ease: "power1.out",
          }
        );
        gsap.fromTo(
          mesh.position,
          {
            y: pos.y - 3,
          },
          {
            y: pos.y,
            duration: 1,
            ease: "power1.out",
          }
        );
      }
    });
  }
  toggleDrywall() {
    const model = this.subModels[ModelParts.drywall];
    const show = this.showingSubModels[ModelParts.drywall];
    if (!(model && show)) {
      return;
    }
    model.forEach((mesh: THREE.Mesh) => {
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const pos = mesh.userData["position"];
      mat.transparent = true;

      console.log(mesh);
      if (show) {
        gsap.fromTo(
          mat,
          {
            opacity: 1,
          },
          {
            opacity: 0,
            duration: 0.3,
            ease: "power1.out",
          }
        );
      } else {
        gsap.fromTo(
          mat,
          {
            opacity: 0,
          },
          {
            opacity: 1,
            duration: 1,
            ease: "power1.out",
          }
        );
        gsap.fromTo(
          mesh.position,
          {
            y: pos.y - 3,
          },
          {
            y: pos.y,
            duration: 1,
            ease: "power1.out",
          }
        );
      }
    });
  }
}
