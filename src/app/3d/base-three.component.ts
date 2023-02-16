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
import { Material, ThreeService } from "./three.service";
import { AppService } from "../app.service";
import { CookieService } from "ngx-cookie-service";
import { round } from "../shared/global-functions";
import { MeshLambertMaterial } from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";

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
  transformControls: TransformControls;
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
  center: { x: number; y: number; z: number };
  animationDuration = 1.5;
  clipHeight = 2;
  clipEnabled = false;
  clipMesh: THREE.Mesh;

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
  OnSectionChangeCallback() {}
  ngAfterViewInit(): void {
    this.house = this.house$.value;
    this.cross = this.house.cross;
    this.construction = this.house.construction;

    this.createScene();
    this.clearScene();

    // resize
    this.observer = new ResizeObserver((x) => this.resize$.next(x));
    this.observer.observe(this.host.nativeElement);

    this.subscriptions.push(
      ...[
        this.appService.states$.subscribe((states) => {
          this.setVisibility(states, this.animationDuration);
        }),
        this.resize$.subscribe(() => {
          this.onResize();
        }),
        this.appService.fullscreen$.subscribe((fullscreen) => {
          this.onResize();
          this.controls.enableZoom = fullscreen;
        }),
        this.appService.tag$.subscribe(() => {
          this.tag = this.appService.tag$.value;
        }),
        this.appService.scroll$.subscribe(() => {
          const scroll = this.appService.scroll$.value;
          const previous = this.section;
          if (this.section !== scroll.section) {
            this.section = scroll.section;
            if (
              previous === undefined ||
              this.orbitControlsCookie !== undefined
            )
              return;
            this.OnSectionChangeCallback();
          }
        }),
      ]
    );
    this.draw();
  }

  clearScene() {
    // Create empty array and new timeline
    this.keys.forEach((key: any) => {
      this.subModels[key] = [];
      this.animations[key] = gsap.timeline();
    });
    this.scene.children.forEach((c) => {
      this.scene.remove(c);
    });
  }
  draw() {
    // this.clearScene();

    if (this.clipEnabled) {
      this.clipMesh = this.threeService.createCube({
        whd: [15, 10, 15],
        xyz: [0, this.clipHeight, 0],
        material: Material.wireFrame,
      });
      this.scene.add(this.clipMesh);
      this.transformControls = new TransformControls(
        this.camera,
        this.renderer.domElement
      );
      this.transformControls.addEventListener("dragging-changed", (event) => {
        const start = event["value"];
        this.controls.enabled = !start;
        if (!start) {
          console.log("moved clip");
          this.draw();
        }
      });
      this.transformControls.attach(this.clipMesh);
      this.scene.add(this.transformControls);
    }
    const states = this.appService.states$.value;

    this.AfterViewInitCallback();

    this.scene.traverse(function (child) {
      // @ts-ignore
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    Object.values(this.keys).forEach((key) => {
      this.subModels[key].forEach((obj) => {
        // try {
        if (this.clipEnabled) {
          if (obj instanceof THREE.Mesh) {
            obj = this.clip(obj, this.clipMesh);
          } else if (obj instanceof THREE.Group) {
            obj = this.clipGroup(obj, this.clipMesh);
          } else {
            console.log(obj);
          }
        }
        // } catch (e) {}
        this.scene.add(obj);
      });
      this.animations[key].progress(states[key] === true ? 0 : 1);
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
    this.scene.background = null;
    this.renderer.shadowMap.enabled = true;
    this.renderer.localClippingEnabled = true;
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);
    this.animate();
    (window as any).camera = this.camera;
    (window as any).renderer = this.renderer;
    (window as any).scene = this.scene;
  }
  yoyo(key: T) {
    setTimeout(() => {
      this.animations[key as any].yoyo(true).repeat(-1).repeatDelay(0.3).play();
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

  /**
   * Adds an array of meshes to the scene
   */
  add(key: T, arr: (THREE.Mesh | THREE.Group)[]) {
    this.subModels[key as any].push(...arr.filter((x) => x));
  }

  // CSG
  clip(mesh: THREE.Mesh, clip: THREE.Mesh): THREE.Mesh {
    mesh.updateMatrix();
    clip.updateMatrix();
    return CSG.subtract(mesh, clip) as THREE.Mesh;
  }

  clipGroup(group: THREE.Group, clip: THREE.Mesh): THREE.Group {
    const newGroup = group.clone();
    const children = group.children;
    newGroup.children = children.map((mesh) => {
      if (mesh instanceof THREE.Mesh) {
        return this.clip(mesh as THREE.Mesh, clip);
      }
      if (mesh instanceof THREE.Group) {
        return this.clipGroup(mesh as THREE.Group, clip);
      }
    });
    return newGroup;
  }

  mergeAll(meshes: THREE.Mesh[]) {
    let mergedMesh = meshes[0];
    meshes.forEach((mesh, i) => {
      if (i === 0) return;
      mergedMesh = this.merge(mergedMesh, mesh);
    });
    return mergedMesh;
  }

  merge(mesh, mesh2) {
    mesh.updateMatrix();
    mesh2.updateMatrix();
    return CSG.union(mesh, mesh2) as THREE.Mesh;
  }
  translate(item: THREE.Mesh | THREE.Group, x, y, z) {
    item.applyMatrix4(new THREE.Matrix4().makeTranslation(x, y, z));
  }

  // GSAP
  pauseAll() {
    this.keys.forEach((key) => {
      this.animations[key].pause();
    });
  }

  /** Sets defaults visibility based on states */
  setVisibility(states, duration = 1.2) {
    this.pauseAll();
    this.keys.forEach((key) => {
      const anim = this.animations[key];
      const show = states[key] === true;
      const visible = anim.progress() === 0;
      const hidden = anim.progress() === 1;
      if (show) {
        if (hidden || duration === 0) {
          anim.timeScale(1).reverse(); // add
        } else {
          gsap.to(anim, { progress: 0, duration });
        }
      } else {
        if (visible || duration === 0) {
          anim.timeScale(2).play(); // remove
        } else {
          gsap.to(anim, { progress: 1, duration });
        }
      }
    });
  }
  group(meshes: THREE.Mesh[]) {
    const group = new THREE.Group();
    meshes.forEach((mesh) => {
      if (mesh) group.add(mesh);
    });
    return group;
  }

  scaleZInOut(key, mesh, duration = 0.3, ease = "power3") {
    this.animations[key].to(mesh.position, {
      z: 0,
      duration,
      ease,
    });
    this.animations[key].to(
      mesh.scale,
      {
        z: 0,
        x: 0,
        duration,
        ease,
      },
      `<`
    );
    this.animations[key].to(mesh, {
      visible: false,
      duration: 0,
    });
  }
  scaleYInOut(key, mesh, duration = 0.3, ease = "power3") {
    this.animations[key].to(mesh.position, {
      y: 0,
      duration,
      ease,
    });
    this.animations[key].to(
      mesh.scale,
      {
        y: 0,
        z: 0,
        duration,
        ease,
      },
      `<`
    );
    this.animations[key].to(mesh, {
      visible: false,
      duration: 0,
    });
  }
  scaleXInOut(key, mesh, duration = 0.3, ease = "power3") {
    this.animations[key].to(mesh.position, {
      x: 0,
      duration,
      ease,
    });
    this.animations[key].to(
      mesh.scale,
      {
        z: 0,
        x: 0,
        duration,
        ease,
      },
      `<`
    );
    this.animations[key].to(mesh, {
      visible: false,
      duration: 0,
    });
  }
}
