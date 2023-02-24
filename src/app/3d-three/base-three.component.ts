import {
  AfterViewInit,
  Component,
  OnDestroy,
  ViewChild,
  ElementRef,
} from "@angular/core";
import {
  ConstructionParts,
  Floor,
  Section,
  Tag,
} from "../components/enum.data";
import { Construction } from "../house/construction.model";
import { Cross, Elevation, RoofPoint } from "../house/cross.model";
import { House } from "../house/house.model";
import {
  BehaviorSubject,
  Subscription,
  fromEvent,
  debounceTime,
  filter,
} from "rxjs";
import { CSG } from "three-csg-ts";
import * as THREE from "three";
import gsap from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { HouseService } from "../house/house.service";
import { ThreeService } from "./three.service";
import { AppService } from "../app.service";
import { CookieService } from "ngx-cookie-service";
import {
  angleBetween,
  angles3D,
  distanceBetweenPoints,
  round,
} from "../shared/global-functions";
import { MeshLambertMaterial, PMREMGenerator, Vector3 } from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import { Material, ThreeMaterialService } from "./three-material.service";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

enum ViewSide {
  East = "East",
  West = "West",
  North = "North",
  South = "South",
  Top = "Top",
  Bottom = "Bottom",
}
const ViewSideAngles = {
  [ViewSide.North]: 0,
  [ViewSide.West]: 90,
  [ViewSide.South]: 180,
  [ViewSide.East]: 270,
};
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
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;

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
  floor: Floor;
  cameraAnimation: gsap.core.Tween;
  cameraZoomAnimation: gsap.core.Tween;
  cameraTargetAnimation: gsap.core.Tween;
  cameraViewSide: ViewSide;
  cameraMargin = 2;

  constructor(
    public threeService: ThreeService,
    public houseService: HouseService,
    public host: ElementRef,
    public appService: AppService,
    public cookieService: CookieService,
    public threeMaterialService: ThreeMaterialService
  ) {}

  //// LifeCircle ////
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.observer.unobserve(this.host.nativeElement);
  }

  AfterViewInitCallback() {}
  OnSectionChangeCallback() {}

  loadManager() {}
  ngAfterViewInit(): void {
    this.house = this.house$.value;
    this.cross = this.house.cross;
    this.construction = this.house.construction;

    this.clearScene();
    this.createScene();

    // resize
    this.observer = new ResizeObserver((x) => this.resize$.next(x));
    this.observer.observe(this.host.nativeElement);

    this.subscriptions.push(
      ...[
        this.appService.floor$.subscribe((floor) => {
          this.floor = floor;
          this.filterOnFloor();
        }),

        this.threeService.update$.subscribe(() => {
          this.onUpdate();
        }),
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

    THREE.DefaultLoadingManager.onStart = function (
      url,
      itemsLoaded,
      itemsTotal
    ) {
      console.log(
        "Started loading file: " +
          url +
          ".\nLoaded " +
          itemsLoaded +
          " of " +
          itemsTotal +
          " files."
      );
    };

    THREE.DefaultLoadingManager.onLoad = function () {
      console.log("Loading Complete!");
    };

    THREE.DefaultLoadingManager.onProgress = function (
      url,
      itemsLoaded,
      itemsTotal
    ) {
      console.log(
        "Loading file: " +
          url +
          ".\nLoaded " +
          itemsLoaded +
          " of " +
          itemsTotal +
          " files."
      );
    };

    THREE.DefaultLoadingManager.onError = function (url) {
      console.log("There was an error loading " + url);
    };
  }

  filterOnFloor() {
    const explode = (group: THREE.Group | THREE.Scene) => {
      group.children.forEach((c) => {
        test(c);
        if (c instanceof THREE.Group) explode(c);
      });
    };

    const test = (c) => {
      const f = c.userData.floor;
      if (f)
        c.visible =
          f === Floor.all || this.floor === Floor.top || f === this.floor;
    };
    explode(this.scene);
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

  env() {
    new RGBELoader().setPath("assets/").load(
      "scythian_tombs_2_4k.hdr",

      (hdrEquiRect, textureData) => {
        const p = new PMREMGenerator(this.renderer);
        const hdrCubeRenderTarget = p.fromEquirectangular(hdrEquiRect);
        p.compileCubemapShader();
        this.threeMaterialService.envTexture = hdrCubeRenderTarget.texture;
        this.scene.background = this.threeMaterialService.envTexture;
        // this.renderer.toneMapping = LinearToneMapping;
        this.renderer.toneMappingExposure = 0.5;
      }
      // texture.mapping = THREE.EquirectangularReflectionMapping;
      // this.scene.background = texture;
      // this.scene.environment = texture;

      // console.log(texture);
      // this.render();
      // });
    );

    // renderer = new THREE.WebGLRenderer( { antialias: true } );
    // renderer.setPixelRatio( window.devicePixelRatio );
    // renderer.setSize( window.innerWidth, window.innerHeight );
    // renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.toneMappingExposure = 1;
    // renderer.outputEncoding = THREE.sRGBEncoding;
    // container.appendChild( renderer.domElement );
  }

  onUpdate() {
    this.setCamera();
  }

  draw() {
    // this.clearScene();

    // this.env();

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
        // // try {
        // if (this.clipEnabled) {
        //   if (obj instanceof THREE.Mesh) {
        //     obj = this.clip(obj, this.clipMesh);
        //   } else if (obj instanceof THREE.Group) {
        //     obj = this.clipGroup(obj, this.clipMesh);
        //   } else {
        // console.log(obj);
        //   }
        // }
        // // } catch (e) {}
        this.scene.add(obj);
      });
      this.animations[key].progress(states[key] === true ? 0 : 1);
    });
    this.filterOnFloor();
  }

  // Three
  onResize(): void {
    const bbox = this.host.nativeElement.getBoundingClientRect();
    const height = bbox.height;
    const width = bbox.width;

    if (this.camera) {
      this.setCamera();
      // this.camera.updateProjectionMatrix();
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

  setCamera() {
    const bbox = this.host.nativeElement.getBoundingClientRect();
    const hostWidth = bbox.width;
    const hostHeight = bbox.height;
    const hostRatio = hostWidth / hostHeight;
    if (this.threeService.cameraPerspective) {
      this.camera = new THREE.PerspectiveCamera(50, hostRatio, 0.1, 1000);
    } else {
      const width =
        Math.max(this.house.houseWidth, this.house.houseLength) +
        this.cameraMargin * 2;
      const height = width / hostRatio;
      this.camera = new THREE.OrthographicCamera(
        -width / 2,
        width / 2,
        height / 2,
        -height / 2,
        -1000,
        1000
      );
    }
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // this.controls.minDistance = 0.1;
    // this.controls.maxDistance = 100;
    (window as any).control = this.controls;
    (window as any).camera = this.camera;

    if (this.threeService.cameraPerspective) {
      this.orbitControlsCookie = this.cookieService.get(
        `${this.modelName}_orbitControls`
      );

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
    } else {
      this.orthographicCameraSnap(ViewSide.North, false);
    }
  }

  orthographicCameraSnap(side?: ViewSide, animate = false) {
    const camera = this.camera as THREE.OrthographicCamera;

    if (this.threeService.cameraPerspective) return;
    const w = this.house.houseWidth;
    const h = this.house.houseLength;
    const z = this.cross.elevations[RoofPoint.topOutside];

    if (side === undefined) {
      animate = true;
      const [vertical, horizontal] = angles3D(
        camera.position,
        this.controls.target
      );

      const between = (angle: number, side: string) => {
        const mid = ViewSideAngles[side] as number;
        if (angle > 360 - 45) angle -= 360;
        return angle < mid + 45 && angle > mid - 45;
      };
      const jump = (
        angle: number,
        side: ViewSide,
        next: ViewSide,
        previous: ViewSide
      ) => {
        const mid = ViewSideAngles[side] as number;
        if (angle > 360 - 45) angle -= 360;
        if (Math.abs(angle - mid) <= 10) return side;
        return angle - mid > 0 ? previous : next;
      };
      if (vertical > 45) {
        side = ViewSide.Top;
      } else if (between(horizontal, ViewSide.North)) {
        side = ViewSide.North;
      } else if (between(horizontal, ViewSide.West)) {
        side = ViewSide.West;
      } else if (between(horizontal, ViewSide.South)) {
        side = ViewSide.South;
      } else if (between(horizontal, ViewSide.East)) {
        side = ViewSide.East;
      }

      if (this.cameraViewSide === side) {
        if (side === ViewSide.East)
          side = jump(
            horizontal,
            ViewSide.East,
            ViewSide.South,
            ViewSide.North
          );
        else if (side === ViewSide.South)
          side = jump(horizontal, ViewSide.South, ViewSide.West, ViewSide.East);
        else if (side === ViewSide.West)
          side = jump(
            horizontal,
            ViewSide.West,
            ViewSide.North,
            ViewSide.South
          );
        else if (side === ViewSide.North)
          side = jump(horizontal, ViewSide.North, ViewSide.East, ViewSide.West);
      }
      this.cameraViewSide = side;
    }

    let obj = { x: 0, y: 0, z: 0 };
    if (side == ViewSide.North) {
      obj = { x: w / 2, y: z / 2, z: h * 0 };
    } else if (side == ViewSide.West) {
      obj = { x: w * 0, y: z / 2, z: h / 2 };
    } else if (side == ViewSide.East) {
      obj = { x: w / 1, y: z / 2, z: h / 2 };
    } else if (side == ViewSide.South) {
      obj = { x: w / 2, y: z / 2, z: h / 1 };
    } else if (side == ViewSide.Top) {
      obj = { x: w / 2, y: z / 1, z: h / 2 + 0.01 }; // forces north
    }

    const viewWidth =
      ([ViewSide.North, ViewSide.South].includes(side) ? w : h) +
      this.cameraMargin * 2;
    const zoom = (camera.right - camera.left) / viewWidth;
    const target = {
      x: w / 2,
      y: z / 2,
      z: h / 2,
    };

    if (animate) {
      this.cameraAnimation = gsap.to(camera.position, {
        duration: 1,
        ...obj,
        onUpdate: () => this.controls.update(),
      });

      this.cameraZoomAnimation = gsap.to(camera, {
        duration: 1,
        zoom: (camera.right - camera.left) / viewWidth,
        onUpdate: () => camera.updateProjectionMatrix(),
      });
      this.cameraTargetAnimation = gsap.to(this.controls.target, {
        duration: 1,
        ...target,
        onUpdate: () => this.controls.update(),
      });

      this.cameraAnimation.play();
      this.cameraZoomAnimation.play();
      this.cameraTargetAnimation.play();
    } else {
      console.log("he?");

      camera.position.set(obj.x, obj.y, obj.z);
      camera.zoom = zoom;
      this.controls.target.set(target.x, target.y, target.z);
      camera.updateProjectionMatrix();
      this.controls.update();
    }

    // this.controls.update();
  }

  createScene(): void {
    this.setCamera();

    // this.scene.background = null;
    this.renderer.shadowMap.enabled = true;
    this.renderer.localClippingEnabled = true;
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);
    this.animate();
    (window as any).camera = this.camera;
    (window as any).renderer = this.renderer;
    (window as any).scene = this.scene;
    this.subscriptions.push(
      fromEvent(this.controls, "change")
        .pipe(debounceTime(1000))
        .subscribe((x) => {
          if (!this.threeService.cameraPerspective) return;
          const json = JSON.stringify([
            {
              camera: this.camera.matrix.toArray(),
              target: this.controls.target.toArray(),
            },
          ]);
          this.cookieService.set(`${this.modelName}_orbitControls`, json);
        })
    );
    this.controls.addEventListener("start", (event) => {
      if (this.cameraAnimation) this.cameraAnimation.kill();
      if (this.cameraZoomAnimation) this.cameraZoomAnimation.kill();
      if (this.cameraTargetAnimation) this.cameraTargetAnimation.kill();
    });
    this.controls.addEventListener("end", (event) => {
      this.orthographicCameraSnap();
    });
  }
  yoyo(key: T) {
    setTimeout(() => {
      this.animations[key as any].yoyo(true).repeat(-1).repeatDelay(0.3).play();
    }, 1000);
  }

  /**
   * Adds an array of meshes to the scene
   */
  add(key: T, arr: THREE.Object3D[], loadDirectToScene = false) {
    this.subModels[key as any].push(...arr.filter((x) => x));
    if (loadDirectToScene) {
      arr.forEach((x) => this.scene.add(x));
    }
  }

  // CSG
  clip(mesh: THREE.Mesh, clip: THREE.Mesh): THREE.Mesh {
    mesh.updateMatrix();
    clip.updateMatrix();
    return CSG.subtract(mesh, clip) as THREE.Mesh;
  }
  // CSG
  intersect(mesh: THREE.Mesh, clip: THREE.Mesh): THREE.Mesh {
    mesh.updateMatrix();
    clip.updateMatrix();
    return CSG.intersect(mesh, clip) as THREE.Mesh;
  }

  // intersect all meshes in group
  intersectGroup(group: THREE.Group, clip: THREE.Mesh): THREE.Group {
    const newGroup = group.clone();
    const children = group.children;
    newGroup.children = children.map((mesh) => {
      if (mesh instanceof THREE.Mesh) {
        return this.intersect(mesh as THREE.Mesh, clip);
      }
      if (mesh instanceof THREE.Group) {
        return this.intersectGroup(mesh as THREE.Group, clip);
      }
    });
    return newGroup;
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
  scale(item: THREE.Mesh | THREE.Group, x, y, z) {
    item.applyMatrix4(new THREE.Matrix4().scale(new Vector3(x, y, z)));
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

  scaleFromSomewhere(
    key,
    mesh: THREE.Mesh | THREE.Group,
    duration = 0.3,
    ease = "linear",
    fromAbove = false
  ) {
    this.animations[key].to(mesh.position, {
      y: fromAbove ? 10 : -10,
      duration,
      ease,
    });
    // this.animations[key].to(
    //   mesh.scale,
    //   {
    //     z: 0,
    //     y: 0,
    //     x: 0,
    //     duration,
    //     ease,
    //   }
    //   // `<`
    // );
    this.animations[key].to(
      mesh,
      {
        visible: false,
        duration: 0,
      }

      // `<`
    );
  }
}
