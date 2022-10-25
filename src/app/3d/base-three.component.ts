import {
  AfterViewInit,
  Component,
  OnDestroy,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { ConstructionParts, Section, Tag } from "../components/enum.data";
import { Construction } from "../house/construction.model";
import { Cross } from "../house/cross.model";
import { House } from "../house/house.model";
import { BehaviorSubject, Subscription, fromEvent, debounceTime } from "rxjs";
import { CSG } from "three-csg-ts";
import * as THREE from "three";
import gsap from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { HouseService } from "../house/house.service";
import { ThreeService } from "./three-window.service";
import { AppService } from "../app.service";
import { CookieService } from "ngx-cookie-service";
import { round } from "../shared/global-functions";
import { MeshLambertMaterial } from "three";

@Component({
  selector: "app-three-house-base",
  template: "",
  styleUrls: [],
})
export class BaseThreeComponent<T> implements AfterViewInit, OnDestroy {
  @ViewChild("rendererContainer") rendererContainer: ElementRef;

  // Technical
  subscriptions: Subscription[] = [];
  observer: ResizeObserver;
  orbitControlsCookie;
  modelName = "base";
  resize$ = new BehaviorSubject(undefined);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  scene = new THREE.Scene();
  controls: OrbitControls;
  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);

  keys: string[];
  subModels: { [part in keyof T]?: (THREE.Mesh | THREE.Group)[] } = {};
  animations: { [part in keyof T]?: gsap.core.Timeline } = {};

  // General
  section: Section;
  tag: Tag;
  house$ = this.houseService.house$;
  house: House;
  cross: Cross;
  construction: Construction;

  constructor(
    public threeService: ThreeService,
    public houseService: HouseService,
    public host: ElementRef,
    public appService: AppService,
    public cookieService: CookieService
  ) {}

  //// LifeCircle ////
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.observer.unobserve(this.host.nativeElement);
  }

  AfterViewInitCallback() {}
  ngAfterViewInit(): void {
    // Create empty array and new timeline
    Object.values(this.keys).forEach((key: any) => {
      this.subModels[key] = [];
      this.animations[key] = gsap.timeline();
    });

    this.house = this.house$.value;
    this.cross = this.house.cross;
    this.construction = this.house.construction;

    this.createScene();

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
      ]
    );
    this.AfterViewInitCallback();

    Object.values(this.keys).forEach((key: any) => {
      this.subModels[key].forEach((x) => this.scene.add(x));
    });
  }

  // Three
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

  // Three
  animate(): void {
    window.requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  createScene(): void {
    this.cookiesAndCamera();
    this.lights();
    this.scene.background = null;
    this.renderer.shadowMap.enabled = true;
    this.renderer.localClippingEnabled = true;
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);
    this.animate();
    (window as any).camera = this.camera;
    (window as any).renderer = this.renderer;
    (window as any).scene = this.scene;
  }
  yoyo(key: T){
    
    setTimeout(() => {
      this.animations[key as any]
        .yoyo(true)
        .repeat(-1)
        .repeatDelay(0.3)
        .play();
    }, 1000);
  }

  // three cookies
  cookiesAndCamera() {
    this.orbitControlsCookie = this.cookieService.get(
      `${this.modelName}_orbitControls`
    );

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = 50;

    const defaultCamera = () => {
      this.camera.position.set(10, 10, 10);
      this.controls.target.set(1, 1, 1);
    };

    try {
      if (this.orbitControlsCookie !== "") {
        const cookie = JSON.parse(this.orbitControlsCookie)[0];
        this.camera.matrix.fromArray(cookie.camera);
        this.camera.matrix.decompose(
          this.camera.position,
          this.camera.quaternion,
          this.camera.scale
        );
        this.controls.target.fromArray(cookie.target);
      } else {
        defaultCamera();
      }
    } catch (e) {
      console.error(e);
      defaultCamera();
    }

    this.controls.update();

    this.subscriptions.push(
      fromEvent(this.controls, "change")
        .pipe(debounceTime(1000))
        .subscribe((x) => {
          const json = JSON.stringify([
            {
              camera: this.camera.matrix.toArray(),
              target: this.controls.target.toArray(),
            },
          ]);
          this.cookieService.set(`${this.modelName}_orbitControls`, json);
        })
    );
  }

  add(key:  T, arr: any[]) {
    this.subModels[key as any].push(...arr);
  }

  lights() {
    const glight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(glight);

    const light = new THREE.DirectionalLight(0xffffff, 0.4);
    light.position.set(30, 30, 30);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;

    light.shadow.mapSize.width = 512 * 2; // default
    light.shadow.mapSize.height = 512 * 2; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 500; // default

    this.scene.add(light);
  }

  
  // CSG
  clip(mesh, clip) {
    mesh.updateMatrix();
    clip.updateMatrix();
    return CSG.subtract(mesh, clip) as THREE.Mesh<
      THREE.BoxGeometry,
      MeshLambertMaterial[]
    >;
  }

  // GSAP
  pauseAll() {
    Object.values(ConstructionParts).forEach((key) => {
      this.animations[key].pause();
    });
  }
}
