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
  House3DParts,
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
import { angles3D } from "../shared/global-functions";
import { MeshLambertMaterial, PMREMGenerator, Vector3 } from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import { Material, ThreeMaterialService } from "./three-material.service";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
// @ts-ignore
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
// @ts-ignore
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
// import SSAOPass from "three.SSAOPass";
// @ts-ignore
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
// @ts-ignore
import Stats from "three/addons/libs/stats.module.js";
// @ts-ignore
import { Sky } from "three/addons/objects/Sky.js";
import { ClipBox } from "./clip-box";

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
  clipBox = new ClipBox();
  floor: Floor;
  cameraAnimation: gsap.core.Tween;
  cameraZoomAnimation: gsap.core.Tween;
  cameraTargetAnimation: gsap.core.Tween;
  cameraViewSide: ViewSide;
  cameraMargin = 2;
  composer: EffectComposer;
  stats: Stats;
  gui: GUI;
  controlsAreActive: boolean;

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
    this.gui.destroy();
  }

  AfterViewInitCallback() {}
  OnSectionChangeCallback() {}
  defaultCamera() {
    this.camera.position.set(10, 10, 10);
    this.controls.target.set(1, 1, 1);
  }

  loadManager() {}
  ngAfterViewInit(): void {
    this.house = this.house$.value;
    this.cross = this.house.cross;
    this.construction = this.house.construction;

    // Create empty array and new timeline
    this.keys.forEach((key: any) => {
      this.subModels[key] = [];
      this.animations[key] = gsap.timeline();
    });
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
        this.clipBox.onChange$.subscribe(() => {
          this.drawAndClip();
        }),
        this.threeService.update$.subscribe(() => {
          this.onUpdate();
        }),
        this.appService.states$.subscribe((states) => {
          this.clipBox.states(states);
          this.setVisibility(states, this.animationDuration);
          this.drawAndClip();
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
    this.initDraw();

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
    console.log("clearScene");

    try {
      this.scene.children.forEach((obj) => {
        if (obj.userData["clipped"] === true) {
          // console.log("removing", obj);
          //
          this.scene.remove(obj);
        }
      });
    } catch (e) {
      console.log(e);
    }
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

  initDraw() {
    // console.log("draw");
    // this.clearScene();
    // this.env();
    // if (this.clipBox.enabled) {
    //   throw new Error("Bleghh");
    // }
    if (this.clipBox.enabled) {
      this.scene.add(this.clipBox);
      const el = Object.values(this.cross.elevations);

      const clipCookie = this.cookieService.get(`${this.modelName}_clip-box`);
      if (clipCookie !== "") {
        const cookie = JSON.parse(clipCookie);
        this.clipBox.setCookie(cookie);
      } else {
        this.clipBox.height = Math.max(...el) - Math.min(...el);
        this.clipBox.xyz[1] = Math.min(...el);
      }
      this.clipBox.drawBox();
    }

    this.AfterViewInitCallback();
    this.scene.traverse((obj) => {
      // @ts-ignore
      if (obj.isMesh) {
        obj.castShadow = true;
      }
    });
    this.drawAndClip();
    this.filterOnFloor();
  }

  drawAndClip() {
    // console.log("drawAndClip", this.scene.children.length);
    const states = this.appService.states$.value;
    const clipper = this.clipBox.box.clone();
    if (this.clipBox.enabled) {
      this.clearScene();
      this.clipBox.box.getWorldPosition(clipper.position);
    }

    // if (this.clipBox.enabled) {
    //   console.log(this.appService.states$.value.clipBoxEnabled);

    //   throw new Error("Bleghh22");
    // }
    Object.values(this.keys).forEach((key) => {
      // if (key !== House3DParts.roof) return;
      this.subModels[key].forEach((obj) => {
        if (this.clipBox.enabled) {
          try {
            this.clipBox.box.updateMatrixWorld(true);

            if (obj instanceof THREE.Mesh) {
              obj = this.clip(obj, clipper);
            } else if (obj instanceof THREE.Group) {
              obj = this.clipGroup(obj, clipper);
            } else {
              console.log(obj);
            }
          } catch (e) {
            console.log(e);
          }
          this.scaleFromSomewhere(key, obj);
          obj.userData["clipped"] = true;
        }
        this.scene.add(obj);
      });

      // console.log(states[key] === true ? 0 : 1, key);

      this.animations[key].progress(states[key] === true ? 0 : 1);
    });
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
    this.composer.setSize(width, height);
    // if (this.scene && this.camera) {
    //   this.renderer.render(this.scene, this.camera);
    //   this.composer.setSize( width, height );
    // }
  }

  debug(mesh) {
    const key = "debug";
    mesh = mesh.clone();
    //@ts-ignore
    mesh.material = new THREE.MeshLambertMaterial({
      color: 0x00ff00,
      opacity: 0.5,
      transparent: true,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    this.add(key as any, [mesh]);
    this.scaleFromSomewhere(key, mesh, 0.5);
  }
  // Three
  animate(): void {
    window.requestAnimationFrame(() => this.animate());

    this.stats.begin();
    if (this.clipBox && !this.controlsAreActive)
      this.clipBox.onMouseOver(
        this.camera,
        this.renderer,
        () => {
          this.cookieService.set(
            `${this.modelName}_clip-box`,
            JSON.stringify({
              xyz: this.clipBox.xyz,
              height: this.clipBox.height,
              width: this.clipBox.width,
              depth: this.clipBox.depth,
            })
          );
        },
        () => {
          this.controls.enableRotate = false;
          this.renderer.domElement.style.cursor = "move";
        },
        () => {
          this.controls.enableRotate = true;
          this.renderer.domElement.style.cursor = "auto";
        }
      );
    this.renderer.render(this.scene, this.camera);
    this.stats.end();
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
    this.setControls();
    (window as any).camera = this.camera;

    if (this.threeService.cameraPerspective) {
      this.orbitControlsCookie = this.cookieService.get(
        `${this.modelName}_orbitControls`
      );

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
          this.defaultCamera();
        }
      } catch (e) {
        console.error(e);
        this.defaultCamera();
      }
    } else {
      this.orthographicCameraSnap(ViewSide.North, false);
    }
    this.controls.update();
  }
  setControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // this.controls.minDistance = 0.1;
    // this.controls.maxDistance = 100;
    (window as any).control = this.controls;
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
      this.controlsAreActive = true;
      if (this.cameraAnimation) this.cameraAnimation.kill();
      if (this.cameraZoomAnimation) this.cameraZoomAnimation.kill();
      if (this.cameraTargetAnimation) this.cameraTargetAnimation.kill();
    });
    this.controls.addEventListener("end", (event) => {
      this.controlsAreActive = false;
      this.orthographicCameraSnap();
    });
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
      camera.position.set(obj.x, obj.y, obj.z);
      camera.zoom = zoom;
      this.controls.target.set(target.x, target.y, target.z);
      camera.updateProjectionMatrix();
      this.controls.update();
    }
  }

  initSky() {
    // Add Sky
    const sky = new Sky();
    sky.scale.setScalar(450000);
    this.scene.add(sky);

    const sun = new THREE.Vector3();

    /// GUI

    const effectController = {
      turbidity: 10,
      rayleigh: 1,
      mieCoefficient: 0.008,
      mieDirectionalG: 0.68,
      elevation: 20,
      azimuth: 13,
      exposure: this.renderer.toneMappingExposure,
    };

    const guiChanged = () => {
      const uniforms = sky.material.uniforms;
      uniforms["turbidity"].value = effectController.turbidity;
      uniforms["rayleigh"].value = effectController.rayleigh;
      uniforms["mieCoefficient"].value = effectController.mieCoefficient;
      uniforms["mieDirectionalG"].value = effectController.mieDirectionalG;

      const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
      const theta = THREE.MathUtils.degToRad(effectController.azimuth);

      sun.setFromSphericalCoords(1, phi, theta);

      uniforms["sunPosition"].value.copy(sun);

      this.renderer.toneMappingExposure = effectController.exposure;
      this.renderer.render(this.scene, this.camera);
    };

    const gui = this.gui.addFolder("Sky");
    gui.add(effectController, "turbidity", 0.0, 20.0, 0.1).onChange(guiChanged);
    gui.add(effectController, "rayleigh", 0.0, 4, 0.001).onChange(guiChanged);
    gui
      .add(effectController, "mieCoefficient", 0.0, 0.1, 0.001)
      .onChange(guiChanged);
    gui
      .add(effectController, "mieDirectionalG", 0.0, 1, 0.001)
      .onChange(guiChanged);
    gui.add(effectController, "elevation", 0, 90, 0.1).onChange(guiChanged);
    gui.add(effectController, "azimuth", -180, 180, 0.1).onChange(guiChanged);
    gui.add(effectController, "exposure", 0, 1, 0.0001).onChange(guiChanged);

    guiChanged();
    gui.close();
  }

  lights(scale = 1) {
    // // const gLight = new THREE.AmbientLight(0x222222, 0.8 * scale);
    // const gLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    // scene.add(gLight);

    const hemiLight = new THREE.HemisphereLight(
      0xffffff,
      0x777777,
      1.1 * scale
    );
    hemiLight.position.set(0, 50, 35);
    this.scene.add(hemiLight);

    const gui = this.gui.addFolder("Lighting");
    gui.close();
    gui.add(hemiLight, "intensity", 0, 3, 0.01);
    // gui.addColor(hemiLight, "color").onChange(function (colorValue) {
    //   hemiLight.color.set(colorValue);
    // });
    // gui.addColor(hemiLight, "groundColor").onChange(function (colorValue) {
    //   hemiLight.groundColor.set(colorValue);
    // });

    const light = new THREE.DirectionalLight(0xffffff, 0.4 * scale);
    light.position.set(15, 30, 45);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;

    // gui.addColor(light, "color").onChange(function (colorValue) {
    //   light.color.set(colorValue);
    // });
    // gui.add(light, "Point intensity", 0, 1, 0.01);

    const i = 3;
    light.shadow.mapSize.width = 512 * 4; // default
    light.shadow.mapSize.height = 512 * 4; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 5000; // default
    light.shadow.bias = -0.0001;

    var side = 30;
    light.shadow.camera.top = side;
    light.shadow.camera.bottom = -side;
    light.shadow.camera.left = side;
    light.shadow.camera.right = -side;

    // this.sky();
    this.initSky();
    this.scene.add(light);
  }
  sky() {
    // SKYDOME

    // @ts-ignore
    scene.fog = new THREE.Fog(scene.background, 10, 100);
    const vertexShader = document.getElementById("vertexShader").textContent;
    const fragmentShader =
      document.getElementById("fragmentShader").textContent;
    const uniforms = {
      topColor: { value: new THREE.Color(0x007744) },
      bottomColor: { value: new THREE.Color(0xff444f) },
      offset: { value: 33 },
      exponent: { value: 0.6 },
    };
    // uniforms["topColor"].value.copy(hemiLight.color);

    // this.scene.fog.color.copy(uniforms["bottomColor"].value);

    const skyGeo = new THREE.SphereGeometry(400, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.BackSide,
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }

  createScene(): void {
    this.setCamera();

    // this.scene.background = null;
    this.renderer.shadowMap.enabled = true;

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;

    this.renderer.localClippingEnabled = true;
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);
    (window as any).camera = this.camera;
    (window as any).renderer = this.renderer;
    (window as any).scene = this.scene;

    this.composer = new EffectComposer(this.renderer);

    const width = window.innerWidth;
    const height = window.innerHeight;

    const ssaoPass = new SSAOPass(this.scene, this.camera, width, height);
    ssaoPass.kernelRadius = 0.6;
    ssaoPass.minDistance = 0.0001;
    ssaoPass.maxDistance = 0.001;
    this.composer.addPass(ssaoPass);

    this.stats = new Stats();
    const statDiv = this.host.nativeElement.appendChild(this.stats.dom);
    statDiv.style.left = "50px";

    // Init gui
    this.gui = new GUI();

    this.gui.close();
    // this.gui
    //   .add(ssaoPass, "output", {
    //     Default: SSAOPass.OUTPUT.Default,
    //     "SSAO Only": SSAOPass.OUTPUT.SSAO,
    //     "SSAO Only + Blur": SSAOPass.OUTPUT.Blur,
    //     Beauty: SSAOPass.OUTPUT.Beauty,
    //     Depth: SSAOPass.OUTPUT.Depth,
    //     Normal: SSAOPass.OUTPUT.Normal,
    //   })
    //   .onChange(function (value) {
    //     ssaoPass.output = parseInt(value);
    //   });
    //   this.gui.add(ssaoPass, "kernelRadius").min(0).max(32);
    //   this.gui.add(ssaoPass, "minDistance").min(0.00001).max(0.002);
    //   this.gui.add(ssaoPass, "maxDistance").min(0.0001).max(0.02);

    this.animate();
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
    arr.forEach((x) => {
      x.userData["key"] = key;
      this.forEachMeshOrGroup(x, (x) => {
        if (x.geometry) {
          x.geometry.userData["key"] = key;
        }
      });
    });
    this.subModels[key as any].push(...arr.filter((x) => x));
    if (loadDirectToScene) {
      arr.forEach((x) => this.scene.add(x));
    }
  }

  forEachMeshOrGroup(x: THREE.Object3D, callback) {
    if (x instanceof THREE.Mesh) {
      callback(x);
    }
    if (x instanceof THREE.Group) {
      x.children.forEach((x) => this.forEachMeshOrGroup(x, callback));
    }
  }

  // CSG
  clip(mesh: THREE.Mesh, clip: THREE.Mesh): THREE.Mesh {
    mesh.updateMatrix();
    mesh.updateWorldMatrix(true, true);
    clip.updateMatrix();
    clip.updateWorldMatrix(true, true);
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
  debugMeasureBlock(x = 1, y = 1, z = 1, s = 1) {
    const mesh = this.threeService.createCube({
      material: Material.floor,
      whd: [s, s, s],
      xyz: [x, y, z],
    });
    this.scene.add(mesh);
  }

  /** Sets defaults visibility based on states */
  setVisibility(states, duration = 1.2) {
    this.pauseAll();
    this.keys.forEach((key) => {
      const anim = this.animations[key];
      const show = states[key] === true;
      const visible = anim.progress() !== 1;
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
