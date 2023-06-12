import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  HostListener,
} from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { AppService } from "src/app/app.service";
import {
  Cross,
  Elevation,
  RoofPoint,
  RoofStyle,
} from "src/app/house/cross.model";
import { xy, xyz } from "src/app/house/house.model";
import { HouseService } from "src/app/house/house.service";
import {
  angleXY,
  centerBetweenPoints,
  distanceBetweenPoints,
  offset,
  round,
} from "src/app/shared/global-functions";
import * as THREE from "three";
import { degToRad } from "three/src/math/MathUtils";
import { ThreeService } from "../three.service";
import { CSG } from "three-csg-ts";
import { BaseThreeComponent } from "../base-three.component";
import {
  Axis,
  Floor,
  House3DParts,
  Section,
} from "src/app/components/enum.data";
import { Room } from "src/app/house-parts/room.model";
import gsap from "gsap";
import { Wall, WallType } from "src/app/house-parts/wall.model";
import { Footprint } from "src/app/house-parts/footprint.model";
import { Window } from "src/app/house-parts/window.model";
import { Door } from "src/app/house-parts/door.model";
import { Thicknesses } from "src/app/house/construction.model";
import { Material, ThreeMaterialService } from "../three-material.service";
import { StatesService } from "src/app/services/states.service";

const enum ClipPart {
  topLeft = "topLeft",
  topMid = "topMid",
  topRight = "topRight",
  centerLeft = "leftMid",
  centerMid = "center",
  centerRight = "rightMid",
  bottomLeft = "bottomLeft",
  bottomMid = "bottomMid",
  bottomRight = "bottomRight",
}
enum RoofClip {
  below = "below",
  above = "above",
  inner = "inner",
  outer = "outer",
  roof = "roof",
  roofAndBelow = "roofAndBelow",
  inBetweenAndBelow = "inBetweenAndBelow",
  roofAndAbove = "roofAndAbove",
}

enum RoofOrientation {
  northSouth = "northSouth",
  westEast = "westEast",
}

interface WindowGenerator {
  selector;
  height;
  width;
  rotate;
  x;
  y;
  z;
  noFraming;
}
@Component({
  selector: "app-three-house",
  templateUrl: "./three-house.component.html",
  styleUrls: ["./three-house.component.scss"],
})
export class ThreeHouseComponent extends BaseThreeComponent<House3DParts> {
  modelName = "House3D";
  keys = Object.values(House3DParts);
  roofMeshes: { [key in RoofClip]?: THREE.Mesh } = {};
  towerClip: THREE.Mesh;
  animationDuration = 0.1;
  windowParts: { [key in ClipPart]?: THREE.Object3D } = {};
  windows: WindowGenerator[] = [];

  @HostListener("document:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === "F4") {
      console.log("reset camera");

      this.camera.position.set(10, 10, 10);
      this.camera.lookAt(0, 0, 0);
    }
    if (event.key === "1") {
      this.focusCamera("in");
    }
    if (event.key === "2") {
      this.focusCamera("out");
    }
  }

  constructor(
    public threeService: ThreeService,
    public houseService: HouseService,
    public host: ElementRef,
    public appService: AppService,
    public cookieService: CookieService,
    public statesService: StatesService,
    public threeMaterialService: ThreeMaterialService
  ) {
    super(
      threeService,
      houseService,
      host,
      appService,
      statesService,
      cookieService,
      threeMaterialService
    );
    this.appService.fullscreen$.next(true);
    this.setInitStates();
    this.preLoadWindow();
    this.importDude();
  }

  setInitStates() {
    const states = this.statesService.states$.value;
    console.log(
      Object.keys(House3DParts).map((x) => states[x]),
      !Object.keys(House3DParts).some((x) => states[x] === true)
    );

    if (!Object.keys(House3DParts).some((x) => states[x] === true)) {
      console.log("Reset states");
      this.statesService.states$.next({
        ...this.statesService.states$.value,
        [House3DParts.roof]: true,
        [House3DParts.outerWall]: true,
        [House3DParts.innerWall]: true,
        [House3DParts.topFloor]: true,
        [House3DParts.groundFloor]: true,
      });
    }
  }

  importDude() {
    this.threeService.importGLTF("Male_Standing.glb", (mesh: THREE.Mesh) => {
      this.scene.add(mesh);
      mesh.scale.set(0.5, 0.5, 0.5);
      const corr = 0.02;
      mesh.position.set(0, corr, 0);
      mesh.updateMatrix();
      // mesh.geometry.translate(0, 0.2, 0);
      mesh.rotateY(degToRad(0));
      this.threeService.translate(
        mesh,
        this.house.centerHouse[0],
        this.house.cross.elevations[Elevation.topFloor],
        this.house.houseLength - 4
      );
    });
  }
  defaultCamera() {
    const x = this.house.houseWidth / 2;
    const y = 2;
    const z = this.house.houseLength / 2;
    this.camera.position.set(-10, 10, -10);
    this.controls.target.set(x, y, z);
  }

  AfterViewInitCallback() {
    this.threeService.basicGround(
      this.scene,
      this.house.cross.elevations[Elevation.ground]
    );
    this.lights(1);
    this.createTowerClip();
    this.createRoofShape();
    this.createFloors();
    this.createWalls();
    // this.hexagonWindows();
    // this.debugMeasureBlock();
    // this.createAllStuds();
    const axesHelper = new THREE.AxesHelper(1);
    axesHelper.position.set(0, 0, 0);
    this.scene.add(axesHelper);
  }

  hexagonWindows() {
    const width = 1.2;
    const height = 1;
    const heightPart = (width / 2) * Math.tan(degToRad(30));
    const coords = [
      [0, 0],
      [width / 2, -heightPart],
      [width, 0],
      [width, height],
      [width / 2, height + heightPart],
      [0, height],
    ] as xy[];

    const mesh = this.threeService.flatShape(coords, 1.1, [Material.osb], 1.1);

    this.threeService.rotateAroundAxis(mesh, degToRad(90), Axis.red);
    this.threeService.rotateAroundAxis(mesh, degToRad(90), Axis.green);
    this.threeService.translate(mesh, 0, height + heightPart, width);
    // this.scene.add(mesh);
    return mesh;
  }

  focusCamera(side: "in" | "out" | "subGround") {
    console.log("camera to", side);
    var timeline = gsap.timeline();
    var duration = 0.4;
    // gsap.globalTimeline.clear();
    let z = this.center.z;
    if (["in"].includes(side)) z += -10;
    if (["subGround"].includes(side)) z += 1;
    if (["out"].includes(side)) z += 10;

    this.pauseAll();
    timeline.to(this.camera.position, {
      duration,
      x: this.center.x - 10,
      y: ["subGround"].includes(side) ? 0 : 1.8, //height
      z,
      onUpdate: () => {
        this.camera.lookAt(this.center.x, this.center.y, this.center.z);
      },
      onComplete: () => {
        gsap.globalTimeline.play();
      },
    });
  }

  OnSectionChangeCallback() {
    console.log("OnSectionChangeCallback");
    if (
      [
        Section.constructionFoundation,
        Section.constructionCrawlerSpace,
      ].includes(this.section)
    ) {
      this.focusCamera("subGround");
    }
  }

  getWindow(window: WindowGenerator) {
    const group = new THREE.Group();
    const dY = window.height - 1;
    const dX = window.width - 1;
    const fullSize = 1.4;
    const size = fullSize / 3;
    Object.keys(this.windowParts).forEach((key) => {
      const mesh = this.windowParts[key].clone() as THREE.Mesh;

      if (
        [ClipPart.centerLeft, ClipPart.centerRight].includes(key as ClipPart)
      ) {
        const scale = window.height / size;
        mesh.scale.set(1, scale, 1);
        // mesh.translateY(window.height - (fullSize + size * 2.9));
        mesh.translateY(-window.height / 2 - 0.2);
        // mesh.translateX(0.1);
      }
      if ([ClipPart.topMid, ClipPart.bottomMid].includes(key as ClipPart)) {
        const scale = window.width / size;
        mesh.scale.set(scale, 1, 1);
        mesh.translateX(-window.width / 2);
        // mesh.translateY(0.1);
      }

      if (
        [ClipPart.topLeft, ClipPart.topMid, ClipPart.topRight].includes(
          key as ClipPart
        )
      ) {
        this.threeService.translate(mesh, 0, dY, 0);
      }

      // if (
      //   [ClipPart.topMid, ClipPart.bottomMid, ClipPart.centerMid].includes(
      //     key as ClipPart
      //   )
      // ) {
      //   this.threeService.translate(mesh, 0, 0, dX / 2);
      // }

      if (
        [
          ClipPart.topRight,
          ClipPart.centerRight,
          ClipPart.bottomRight,
        ].includes(key as ClipPart)
      ) {
        this.threeService.translate(mesh, 0, 0, dX);
      }

      group.add(mesh);
    });

    this.threeService.rotateAroundAxis(
      group,
      -degToRad(window.rotate),
      Axis.green
    );
    this.threeService.translate(group, window.x, window.y, window.z);
    group.userData["key"] = "WindowFrame";
    group.name = window.selector;
    return group;
  }
  preLoadWindow() {
    const material = this.threeMaterialService.getMaterial(Material.white);
    this.threeService.importGLTF("window.glb", (mesh: THREE.Group) => {
      this.windowParts = {};
      mesh.children.forEach((child: THREE.Mesh) => {
        child.material = material;
      });

      [...Array(3).keys()].forEach((i) => {
        [...Array(3).keys()].forEach((j) => {
          const x = mesh.clone();
          let part: ClipPart;
          // if (!(i === 0 && j === 0)) return;
          if (i === 0 && j === 0) part = ClipPart.bottomLeft;
          if (i === 1 && j === 0) part = ClipPart.bottomMid;
          if (i === 2 && j === 0) part = ClipPart.bottomRight;
          if (i === 0 && j === 1) part = ClipPart.centerLeft;
          if (i === 1 && j === 1) part = ClipPart.centerMid;
          if (i === 2 && j === 1) part = ClipPart.centerRight;
          if (i === 0 && j === 2) part = ClipPart.topLeft;
          if (i === 1 && j === 2) part = ClipPart.topMid;
          if (i === 2 && j === 2) part = ClipPart.topRight;

          const size = 1.4 / 3;
          const clipBox = this.threeService.createCube({
            material: Material.unknown,
            whd: [size, size, size],
            xyz: [size * i - 0.2, size * j - 0.2, -size / 3],
          });
          const m = this.intersectGroup(x, clipBox); // windowParts[part]
          this.threeService.rotateAroundAxis(m, degToRad(-90), Axis.green);

          // this.threeService.translate(m, 0.08, -0.06, -0.06);

          this.windowParts[part] = m;
          // this.scene.add(clipBox);
        });
      });

      // Done loading
      const mainOuterWall = this.subModels[House3DParts.outerWall][0]; // get Group
      this.windows.map((obj) => {
        // if (obj.noFraming) return;
        // const frame = this.getWindow(obj);
        // mainOuterWall.add(frame);
      });
    });
  }
  // =================== CREATE ============================

  createTowerClip() {
    const key = House3DParts.tower;
    const coords = this.house.tower.outerCoords;
    const z = this.cross.elevations[Elevation.towerTop];
    const mesh = this.threeService.flatShape(coords, z, [Material.concrete], z);
    this.add(key, [mesh]);
    this.scaleFromSomewhere(key, mesh, 0.1);
    this.towerClip = mesh;
  }
  createRoofShape() {
    const key = House3DParts.roof;
    const p = this.cross.roofPoints;
    const stramienWE = this.house.stramien.out.we;
    const stramienNS = this.house.stramien.out.ns;
    const overhang = 0.8;
    const roofHalfMeshes = {};

    // Basic Coords

    const outsideCoords = [p.topOutside, p.bendOutside, p.lowestOutside];
    const insideCoords = [p.topInside, p.bendInside, p.lowestInside];
    const betweenCoords = [
      centerBetweenPoints(p.topOutside, p.topInside, 0.8),
      centerBetweenPoints(p.bendOutside, p.bendInside, 0.8),
      centerBetweenPoints(p.lowestOutside, p.lowestInside, 0.8),
    ];
    const aboveCoords = [
      offset(p.topOutside, [0, 3]),
      offset(p.bendOutside, [-1, 3]),
      offset(p.lowestOutside, [0, 0]),
    ];
    const topOffset = distanceBetweenPoints(betweenCoords[0], p.topOutside);

    const mirror = (coords: xy[]) => {
      const f = coords[0];
      return [
        ...coords,
        ...coords
          .map((xy) => [-xy[0] + f[0] * 2, xy[1]] as xy)
          .slice()
          .reverse(),
      ].map((xy) => [f[0] - xy[0], f[1] - xy[1]] as xy);
    };

    const roofCoords: { [key in RoofClip]: xy[] } = {
      [RoofClip.below]: mirror([
        ...insideCoords,
        offset(p.lowestInside, [0, -1]),
      ]),
      [RoofClip.above]: mirror([
        ...outsideCoords,
        ...aboveCoords.slice().reverse(),
      ]),
      [RoofClip.outer]: mirror([
        ...outsideCoords,
        ...betweenCoords.slice().reverse(),
      ]),
      [RoofClip.inner]: mirror([
        ...insideCoords,
        ...betweenCoords.slice().reverse(),
      ]),
      [RoofClip.roof]: mirror([
        ...insideCoords,
        ...outsideCoords.slice().reverse(),
      ]),
      [RoofClip.roofAndAbove]: mirror([
        ...insideCoords,
        ...aboveCoords.slice().reverse(),
      ]),
      [RoofClip.roofAndBelow]: mirror([
        ...outsideCoords,
        offset(p.lowestOutside, [0, -1]),
      ]),
      [RoofClip.inBetweenAndBelow]: mirror([
        ...betweenCoords,
        offset(p.lowestOutside, [0, -1]),
      ]),
    };

    const diagonalClipNS = this.threeService.flatShape(
      [
        offset(this.house.centerHouse, [10, 10]),
        offset(this.house.centerHouse, [-10, 10]),
        this.house.centerHouse,
        offset(this.house.centerHouse, [-10, -10]),
        offset(this.house.centerHouse, [10, -10]),
        this.house.centerHouse,
      ],
      10,
      [Material.concrete],
      10
    );
    const diagonalClipWE = this.threeService.flatShape(
      [
        offset(this.house.centerHouse, [10, 10]),
        offset(this.house.centerHouse, [10, -10]),
        this.house.centerHouse,
        offset(this.house.centerHouse, [-10, -10]),
        offset(this.house.centerHouse, [-10, 10]),
        this.house.centerHouse,
      ],
      10,
      [Material.concrete],
      10
    );

    // Generate half meshes
    Object.values(RoofOrientation).map((roofOrientation) => {
      roofHalfMeshes[roofOrientation] = {};
      Object.values(RoofClip).map((roofClip, i) => {
        let elevation;
        const coords = roofCoords[roofClip];
        const length =
          roofOrientation === RoofOrientation.northSouth
            ? stramienNS.d - stramienNS.a
            : stramienWE.d - stramienWE.a;

        const move =
          roofOrientation === RoofOrientation.northSouth
            ? stramienWE.b + (stramienWE.c - stramienWE.b) / 2
            : stramienNS.b + (stramienNS.c - stramienNS.b) / 2;

        if (
          [
            RoofClip.below,
            RoofClip.inner,
            RoofClip.roof,
            RoofClip.roofAndAbove,
          ].includes(roofClip)
        ) {
          elevation = this.cross.elevations[RoofPoint.topInside];
        } else if (roofClip === RoofClip.inBetweenAndBelow) {
          elevation = this.cross.elevations[RoofPoint.topOutside] - topOffset;
        } else {
          elevation = this.cross.elevations[RoofPoint.topOutside];
        }

        const mesh = this.threeService.flatShape(
          coords,
          0,
          roofClip === RoofClip.outer ? [Material.roof] : [Material.white],
          length + overhang * 2
        );
        this.threeService.rotateAroundAxis(mesh, degToRad(90), Axis.red);
        if (roofOrientation === RoofOrientation.westEast) {
          this.threeService.rotateAroundAxis(mesh, degToRad(90), Axis.green);
        }

        this.threeService.translate(
          mesh,
          roofOrientation === RoofOrientation.northSouth
            ? move
            : length + overhang,
          elevation,
          roofOrientation === RoofOrientation.northSouth
            ? length + overhang
            : move
        );

        roofHalfMeshes[roofOrientation][roofClip] = this.clip(
          mesh,
          roofOrientation === RoofOrientation.westEast
            ? diagonalClipNS
            : diagonalClipWE
        );
      });
    });

    Object.values(RoofClip).map((key, i) => {
      this.roofMeshes[key] = this.merge(
        roofHalfMeshes[RoofOrientation.northSouth][key],
        roofHalfMeshes[RoofOrientation.westEast][key]
      );
    });

    let [towerRoofInlay, towerRoofInlayClip] = this.towerRoofInlay();
    const loweredTowerRoofInlayClip = towerRoofInlayClip.clone();
    this.threeService.translate(loweredTowerRoofInlayClip, 0, -0.3, 0);
    const towerRoofMesh = this.towerRoof();

    const clipOther = (meshKey: RoofClip, mesh: THREE.Mesh) => {
      this.roofMeshes[meshKey] = this.clip(
        this.roofMeshes[meshKey].clone(),
        mesh.clone()
      );
    };

    clipOther(RoofClip.outer, towerRoofInlayClip);
    clipOther(RoofClip.inner, towerRoofInlayClip);
    clipOther(RoofClip.above, towerRoofInlayClip);
    clipOther(RoofClip.roofAndAbove, loweredTowerRoofInlayClip);

    clipOther(RoofClip.roofAndAbove, this.towerClip);
    clipOther(RoofClip.above, this.towerClip);
    clipOther(RoofClip.outer, this.towerClip);
    clipOther(RoofClip.inner, this.towerClip);

    this.roofMeshes[RoofClip.roofAndBelow] = this.merge(
      this.roofMeshes[RoofClip.roofAndBelow],
      towerRoofInlayClip
    );
    // this.roofMeshes[RoofClip.roofAndAbove] = this.merge(
    //   this.roofMeshes[RoofClip.roofAndAbove],
    //   halfTowerTopFloor
    // );

    // Create a group for the roof and add it to the scene

    const totalRoofGroup = new THREE.Group();
    totalRoofGroup.add(this.roofMeshes[RoofClip.inner]);
    totalRoofGroup.add(this.roofMeshes[RoofClip.outer]);
    totalRoofGroup.add(towerRoofInlay);
    totalRoofGroup.add(towerRoofMesh);
    this.scaleFromSomewhere(key, totalRoofGroup, 1, undefined, true);
    this.add(key, [totalRoofGroup]);
  }
  towerRoof() {
    const depth = 0.2;
    const mesh = this.threeService.flatShape(
      this.house.tower.outerCoords,
      this.cross.elevations[Elevation.towerTop] + depth,
      [Material.roof],
      depth
    );
    return mesh;
  }

  splitTowerRoofInlay(towerRoofInlayInnerRoof: THREE.Mesh): THREE.Mesh[] {
    const lower = towerRoofInlayInnerRoof.clone();
    this.threeService.translate(lower, 0, -0.1, 0);
    const outer = this.clip(towerRoofInlayInnerRoof, lower);
    this.threeService.translate(lower, 0, -0.4, 0);
    const inner = this.clip(this.clip(towerRoofInlayInnerRoof, lower), outer);
    return [inner, outer].map((x) =>
      this.clip(x, this.roofMeshes[RoofClip.inBetweenAndBelow])
    );
  }
  towerRoofInlay(): [THREE.Group, THREE.Mesh] {
    // const depth = 5;
    const z = 0;
    const h = 1;
    const s = this.house.stramien.out;

    const endPoint = centerBetweenPoints(
      this.house.tower.outerCoords[4],
      this.house.tower.outerCoords[7]
    );
    const centerRoof: xy = [
      s.we.c - (s.we.c - s.we.b) / 2,
      s.ns.c - (s.ns.c - s.ns.b) / 2,
    ];
    const depth = distanceBetweenPoints(endPoint, centerRoof);

    const towerWidth = distanceBetweenPoints(
      this.house.tower.outerCoords[0],
      this.house.tower.outerCoords[3]
    );
    const coords: xy[] = [
      [-towerWidth / 2, -2],
      [-towerWidth / 2, 0],
      [0, h],
      [towerWidth / 2, 0],
      [towerWidth / 2, -2],
    ];

    let mesh = this.threeService.flatShape(
      coords,
      z,
      [Material.unknown],
      depth
    );
    this.threeService.rotateAroundAxis(mesh, degToRad(90), Axis.blue);
    this.threeService.rotateAroundAxis(mesh, degToRad(-90), Axis.red);
    this.threeService.rotateAroundAxis(mesh, degToRad(45), Axis.green);
    this.translate(
      mesh,
      centerRoof[0],
      this.cross.elevations[RoofPoint.topInside] - h,
      centerRoof[1]
    );
    // Create group, with inner and outer part
    const group = new THREE.Group();
    const [inner, outer] = this.splitTowerRoofInlay(
      this.clip(mesh.clone(), this.towerClip)
    );
    inner.material = this.threeMaterialService.getMaterial(Material.white);
    outer.material = this.threeMaterialService.getMaterial(Material.roof);
    group.add(inner);
    group.add(outer);
    return [group, mesh];
  }

  createAllStuds() {
    const studGroup = new THREE.Group();
    const s = this.house.stramien.in;
    const joistHeight = this.house.construction.thickness[Thicknesses.joists];
    const otherSideDistance = s.ns.c - s.ns.b; //- joistHeight * 2;
    const maxStuds = Math.max(
      ...[
        this.house.studAmountWest,
        this.house.studAmountEast,
        this.house.studAmountNorth,
        this.house.studAmountSouth,
      ]
    );

    ["North", "South", "East", "West"].forEach((side) => {
      for (let i = 0; i < maxStuds; i++) {
        const step = this.house.studDistance * (i + 1);
        let origin = [0, 0];
        let origin2 = [0, 0];
        let rotation = 0;
        if (side === "West") {
          if (i > this.house.studAmountWest) return;
          origin = [s.we.b - step, s.ns.b - joistHeight];
          origin2 = [origin[0], origin[1] + otherSideDistance];
        }
        if (side === "East") {
          if (i > this.house.studAmountEast) return;
          origin = [s.we.c + step, s.ns.b];
          origin2 = [origin[0], origin[1] + otherSideDistance];
        }
        if (side === "North") {
          if (i > this.house.studAmountNorth) return;
          origin = [s.we.b, s.ns.b - step];
          origin2 = [origin[0] + otherSideDistance, origin[1]];
          rotation = degToRad(90);
        }
        if (side === "South") {
          if (i > this.house.studAmountSouth) return;
          origin = [s.we.b, s.ns.c + step];
          origin2 = [origin[0] + otherSideDistance, origin[1]];
          rotation = degToRad(90);
        }
        const mesh = this.createStud();
        const mesh2 = this.createStud();
        this.threeService.rotateAroundAxis(mesh, rotation, Axis.green);
        this.threeService.rotateAroundAxis(mesh2, rotation, Axis.green);
        this.threeService.translate(mesh, origin[0], 0, origin[1]);
        this.threeService.translate(mesh2, origin2[0], 0, origin2[1]);
        studGroup.add(mesh);
        studGroup.add(mesh2);
      }
    });
    // this.add(House3DParts.studs, [studGroup]);
  }

  createStud(
    length = 1,
    joistHeight = 300 / 1000,
    osbThickness = 12 / 1000,
    joistWidth = 40 / 1000,
    fleshHeight = 30 / 1000
  ) {
    const group = new THREE.Group();
    const fleshTop = this.threeService.createCube({
      material: Material.pine,
      whd: [joistWidth, length, fleshHeight],
      xyz: [0, 0, 0],
    });
    group.add(fleshTop);
    const body = this.threeService.createCube({
      material: Material.osb,
      whd: [osbThickness, length, joistHeight - fleshHeight * 2],
      xyz: [joistWidth / 2 - osbThickness / 2, 0, fleshHeight],
    });
    group.add(body);
    const fleshBottom = this.threeService.createCube({
      material: Material.pine,
      whd: [joistWidth, length, fleshHeight],
      xyz: [0, 0, joistHeight - fleshHeight],
    });
    group.add(fleshBottom);
    return group;
  }

  createFloors() {
    const ratio = 0.8;
    [
      {
        floor: Floor.ground,
        key: House3DParts.groundFloor,
        z: Elevation.groundFloor,
        t: this.cross.groundFloorThickness,
      },
      {
        floor: Floor.top,
        key: House3DParts.topFloor,
        z: Elevation.topFloor,
        t: this.cross.topFloorThickness,
      },
    ].forEach((obj) => {
      const group = new THREE.Group();
      [true, false].forEach((upper) => {
        const t = obj.t * (upper ? 1 - ratio : ratio);
        const elevation = this.cross.elevations[obj.z];
        const z = upper ? elevation : elevation - obj.t * (1 - ratio);

        const footprint = this.house.partsFlatten.find(
          (x) => x instanceof Footprint
        ) as Footprint;

        let mesh: THREE.Mesh<any> = this.threeService.flatShape(
          footprint.coords,
          z,
          upper ? [Material.floor] : [Material.ral9016],
          t
        );

        const holes = this.house.partsFlatten.filter(
          (x) =>
            x instanceof Room &&
            x.hole === true &&
            [obj.floor].includes(x.floor)
        ) as Room[];

        holes.forEach((opening) => {
          const clipCube = this.threeService.flatShape(
            opening.coords,
            z + 1,
            [Material.unknown],
            t + 2
          );
          mesh = this.clip(mesh, clipCube);

          if (
            obj.floor === Floor.top &&
            opening.selector === "L1-void" &&
            !upper
          ) {
            const w = opening.coords[1][0] - opening.coords[0][0];
            const clipEdge = this.threeService.flatShape(
              [
                [0, 0],
                [0, -t],
                [Math.tan(degToRad(90 - 34)) * t, 0],
              ],
              w,
              [Material.unknown],
              w
            );
            this.threeService.rotateAroundAxis(
              clipEdge,
              degToRad(90),
              Axis.red
            );
            this.threeService.rotateAroundAxis(
              clipEdge,
              degToRad(90),
              Axis.green
            );
            this.translate(
              clipEdge,
              opening.coords[0][0],
              z - t,
              opening.coords[0][1]
            );
            // this.scene.add(clipEdge);
            mesh = this.clip(mesh, clipEdge);
          }
        });
        group.add(mesh);
      });

      this.scaleFromSomewhere(
        obj.key,
        group,
        1,
        undefined,
        obj.floor === Floor.top
      );
      this.add(obj.key, [group]);
    });
  }

  curtainWall(wall: Wall): THREE.Mesh[] {
    const window = wall.parts.find((x) => x instanceof Window) as Window;
    const house = this.house;
    const pushback = 0.1;
    const depth = 0.1;
    const width = window.width;

    const horizontalBar1 = this.threeService.createBox({
      material: Material.windowDarkFrame,
      whd: [width, 0.3, depth],
      xyz: [
        window.origin[0],
        house.cross.ceilingHeight,
        window.origin[1] - depth - pushback,
      ],
    });

    const horizontalBar2 = this.threeService.createBox({
      material: Material.windowDarkFrame,
      whd: [width, 0.2, depth],
      xyz: [
        window.origin[0],
        house.cross.elevations[RoofPoint.bendInside] - 0.2,
        window.origin[1] - depth - pushback,
      ],
    });
    ///

    const p = this.cross.roofPoints;
    const e = this.cross.elevations;

    const dX = p[RoofPoint.wallInside][0];
    const dY = window.elevation;

    const b = p[RoofPoint.bendInside];
    let coords: xy[] = [
      [0, 0],
      offset(p[RoofPoint.wallInside], [-dX, -dY]),
      offset(p[RoofPoint.bendInside], [-dX, -dY]),
      offset(p[RoofPoint.topInside], [-dX, -dY]),
      [this.house.outerBase - b[0] - dX, b[1] + -dY],
      [window.width, p[RoofPoint.wallInside][1] + -dY],
      [window.width, 0],

      [0, 0],
      [0, -1],
      [window.width + 2, -1],
      [window.width + 2, p[RoofPoint.wallInside][1] + -dY],
      [this.house.outerBase - b[0] - dX + 2, b[1] + -dY + 2],
      offset(p[RoofPoint.topInside], [-dX, -dY + 2]),
      offset(p[RoofPoint.bendInside], [-dX - 2, -dY + 2]),
      offset(p[RoofPoint.wallInside], [-dX - 2, -dY]),
      [-2, 0],
      [-2, -1],
      [0, -1],
    ];

    const clip = this.threeService.extrudedShape({
      material: Material.unknown,
      coords,
      xyz: [window.origin[0], 0, window.origin[1]],
      depth: 1,
    });

    this.debug(clip);

    const amount = 5;
    const w = 0.1;
    // create array of amount
    const verticals = Array.from(Array(amount + 1).keys()).map((x, i) => {
      // calculate offset of each bar
      const offset = ((width - w) / amount) * i;
      let mesh = this.threeService.createBox({
        material: Material.windowDarkFrame,
        whd: [w, this.house.cross.elevations[RoofPoint.topInside], depth],
        xyz: [
          window.origin[0] + offset,
          0,
          window.origin[1] - depth - pushback,
        ],
      });

      mesh = this.clip(mesh, clip);
      return mesh;
    });

    return [
      horizontalBar1,
      // horizontalBar2,
      ...verticals,
    ];
  }

  createWalls() {
    const walls = this.house.partsFlatten.filter(
      (x) => x instanceof Wall
    ) as any[];

    const groundFloorLevel = this.cross.elevations[Elevation.groundFloor];
    const topFloorLevel = this.cross.elevations[Elevation.topFloor];
    const innerWallParts = [];
    const outerWallParts = [];
    const openingParts = [];
    const halfTowerTopFloor = this.threeService.flatShape(
      [
        this.house.tower.outerCoords[0],
        ...this.house.tower.outerCoords.slice(3),
      ],
      this.cross.elevations[Elevation.towerTop],
      [Material.concrete],
      this.cross.elevations[Elevation.towerTop] -
        this.cross.elevations[RoofPoint.wallInside]
    );
    walls.forEach((wall) => {
      let coords: xy[] = wall.getFootPrint();
      if (coords.length < 4) return;

      const outer = wall.type === WallType.outer;
      const tower = wall.tower === true;
      const higherTower = wall.floor === Floor.tower && tower;

      let elevation = this.cross.elevations[Elevation.groundFloor];
      if (outer) elevation = this.cross.elevations[Elevation.ground];
      if ([Floor.top].includes(wall.floor))
        elevation = this.cross.elevations[Elevation.topFloor];
      if ([Floor.tower].includes(wall.floor))
        elevation = this.cross.elevations[Elevation.topFloor];
      if (higherTower) elevation = this.cross.elevations[RoofPoint.wallInside];

      let height = wall.ceiling - elevation;
      if (wall.gable || [Floor.top, Floor.all].includes(wall.floor))
        height = this.cross.elevations[RoofPoint.topInside] - elevation;
      if (higherTower || tower)
        height = this.cross.elevations[Elevation.towerTop] - elevation;
      height = Math.max(height, 0);

      const splitFootprint = (
        [in1, in2, out1, out2]: xy[],
        first: boolean,
        ratio: number
      ) => {
        const half1 = centerBetweenPoints(in1, out2, ratio);
        const half2 = centerBetweenPoints(in2, out1, ratio);
        if (first) {
          return [in1, in2, half2, half1];
        } else {
          return [half1, half2, out1, out2];
        }
      };
      const ratio = 2 - 0.2;
      let wallMesh = this.threeService.flatShape(
        splitFootprint(coords, true, ratio),
        height + elevation,
        [Material.ral9016],
        height
      );

      if (higherTower) {
        wallMesh = this.clip(wallMesh, this.roofMeshes[RoofClip.roofAndBelow]);
      } else if (tower) {
        wallMesh = this.clip(wallMesh, halfTowerTopFloor);
      } else {
        wallMesh = this.clip(wallMesh, this.roofMeshes[RoofClip.roofAndAbove]);
      }

      let wallOuter;
      if (outer) {
        wallOuter = this.threeService.flatShape(
          splitFootprint(coords, false, ratio),
          height + elevation,
          [Material.facade],
          height
        );

        if (higherTower) {
          wallOuter = this.clip(
            wallOuter,
            this.roofMeshes[RoofClip.roofAndBelow]
          );
        } else if (tower) {
          wallOuter = this.clip(wallOuter, halfTowerTopFloor);
        } else {
          wallOuter = this.clip(
            wallOuter,
            this.roofMeshes[RoofClip.roofAndAbove]
          );
        }
      }
      const openings = wall.parts
        ? (wall.parts.filter(
            (x) => x instanceof Window || x instanceof Door
          ) as (Window | Door)[])
        : [];
      openings.forEach((opening) => {
        let y, origin;
        const height = opening.height;
        const width = opening.width;
        const x = opening.origin[0];
        const z = opening.origin[1];
        const floorLevel = [Floor.ground, Floor.all].includes(opening.floor)
          ? groundFloorLevel
          : topFloorLevel;
        if (opening instanceof Window) {
          y = floorLevel + opening.elevation;
          origin = 0;
        }
        if (opening instanceof Door) {
          y = floorLevel;
          origin = opening.scale[1] === 1 ? -opening.width : 0;
          if (opening.floor === Floor.ground) {
            if (opening.width === 0.1) console.log(opening.width);
          }
        }
        const size = 2;
        let clipCube: THREE.Mesh = this.threeService.createCube({
          material: Material.white,
          whd: [size, height, width],
          xyz: [-size / 2, 0, origin],
        });

        const hexagonWindow = wall.gable && opening.floor === Floor.top;
        if (hexagonWindow) clipCube = this.hexagonWindows();

        this.threeService.rotateAroundAxis(
          clipCube,
          degToRad(-opening.rotate),
          Axis.green
        );

        this.threeService.translate(clipCube, x, y, z);
        wallMesh = this.clip(wallMesh, clipCube);
        if (wallOuter) wallOuter = this.clip(wallOuter, clipCube);

        if (opening instanceof Door) {
          openingParts.push(this.createDoor(opening, x, y, z, origin));
        }
        if (opening instanceof Window) {
          this.windows.push({
            height: opening.height,
            width: opening.width,
            x,
            y,
            z,
            rotate: opening.rotate,
            selector: opening.selector,
            noFraming:
              opening.selector === "L0-outer-SouthWall-2-Window-14" ||
              hexagonWindow,
          });
          // openingParts.push(this.createWindowPlane(opening, x, y, z));
        }
      });

      wallMesh.userData = { floor: wall.floor };
      if (outer || higherTower) {
        const g = this.group([wallMesh, wallOuter]);
        // g.userData = { floor: wall.floor };
        g.name = wall.selector;
        outerWallParts.push(g);
      } else {
        const g = this.group([wallMesh, wallOuter]);
        g.name = wall.selector;
        innerWallParts.push(g);
      }
    });

    const pillar = this.createPilasters();

    const totalOuterWall = this.group([
      ...outerWallParts,
      ...pillar,
      ...openingParts,
      ...this.curtainWall(
        walls.find((x) => x.selector === "L0-outer-SouthWall-2")
      ),
    ]);

    this.scaleFromSomewhere(House3DParts.outerWall, totalOuterWall);
    this.add(House3DParts.outerWall, [totalOuterWall]);
    const totalInnerWall = this.group(innerWallParts);
    this.scaleFromSomewhere(House3DParts.innerWall, totalInnerWall);
    this.add(House3DParts.innerWall, [totalInnerWall]);
  }

  createDoor(door: Door, x, y, z, origin) {
    if (!door.outside) return;

    origin = door.scale[1] === -1 ? -door.width : 0;

    const mesh = this.threeService.createCube({
      material: Material.ral9016,
      whd: [door.width, door.height, 0.1],
      xyz: [origin, 0, 0],
    });

    this.threeService.rotateAroundAxis(
      mesh,
      degToRad(-door.rotate + 90),
      Axis.green
    );
    this.translate(mesh, x, y, z);
    return mesh;
  }

  createWindowPlane(opening: Window, x, y, z) {
    let coords: xy[] = [];
    if (opening.selector === "L0-outer-SouthWall-2-Window-14") {
      const p = this.cross.roofPoints;
      const e = this.cross.elevations;
      const wall = p[RoofPoint.wallInside][0];
      const lift = opening.elevation;
      const b = p[RoofPoint.bendInside];
      coords = [
        [0, 0],
        offset(p[RoofPoint.wallInside], [-wall, -lift]),
        offset(b, [-wall, -lift]),
        offset(p[RoofPoint.topInside], [-wall, -lift]),
        [this.house.outerBase - b[0] - wall, b[1] + -lift],
        [opening.width, p[RoofPoint.wallInside][1] + -lift],
        [opening.width, 0],
      ];
    } else {
      coords = [
        [0, 0],
        [0, opening.height],
        [opening.width, opening.height],
        [opening.width, 0],
      ];
    }

    const mesh = this.threeService.createPane({
      material: Material.window,
      coords,
      xyz: [0, 0, -0.2],
    });
    this.threeService.rotateAroundAxis(
      mesh,
      degToRad(-(opening.rotate + 90)),
      Axis.green
    );
    this.translate(mesh, x, y, z);
    // this.scene.add(mesh);

    return mesh;
  }

  createPilasters() {
    const s = this.house.stramien.out;
    const corners = [
      [s.we.b, s.ns.a, 0],
      [s.we.c, s.ns.a, -90],
      [s.we.d, s.ns.b, -90],
      [s.we.d, s.ns.c, 180],
      [s.we.c, s.ns.d, 180],
      [s.we.b, s.ns.d, 90],
      [s.we.a, s.ns.c, 90],
      [s.we.a, s.ns.b, 0],
    ];

    const plankSize = 0.2;
    const plankThickness = 0.04;
    const cornerMeshes: THREE.Object3D[] = [];
    corners.forEach(([x, y, rotate]) => {
      let mesh1: THREE.Mesh = this.threeService.createCube({
        material: Material.white,
        whd: [plankThickness, 7, plankSize + plankThickness],
        xyz: [
          -plankThickness,
          this.cross.elevations[Elevation.ground],
          -plankThickness,
        ],
      });
      let mesh2: THREE.Mesh = this.threeService.createCube({
        material: Material.unknown,
        whd: [plankSize, 7, plankThickness],
        xyz: [0, this.cross.elevations[Elevation.ground], -plankThickness],
      });

      let merge = this.merge(mesh1, mesh2);
      this.threeService.rotateAroundAxis(merge, degToRad(rotate), Axis.green);
      this.translate(merge, x, 0, y);

      merge = this.clip(merge, this.roofMeshes[RoofClip.roofAndAbove]);
      cornerMeshes.push(merge);
    });

    return cornerMeshes;
  }
}
