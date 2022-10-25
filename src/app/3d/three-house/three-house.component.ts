import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
} from "@angular/core";
import gsap from "gsap";
import { CookieService } from "ngx-cookie-service";
import { BehaviorSubject, Subscription, fromEvent, debounceTime } from "rxjs";
import { AppService } from "src/app/app.service";
import {
  ConstructionParts,
  Section,
  State,
  Tag,
} from "src/app/components/enum.data";
import { Construction, Thicknesses } from "src/app/house/construction.model";
import { Cross, Elevation, RoofPoint } from "src/app/house/cross.model";
import { xy, xyz } from "src/app/house/house.model";
import { HouseService } from "src/app/house/house.service";
import {
  angleBetween,
  angleXY,
  getDiagonal,
  offset,
  phi,
  round,
} from "src/app/shared/global-functions";
import * as THREE from "three";
import { MeshLambertMaterial, MeshPhongMaterial, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { degToRad } from "three/src/math/MathUtils";
import {
  CubeProperties,
  Material,
  ThreeService,
} from "../three-window.service";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { Window } from "src/app/house/window.model";
import { CSG } from "three-csg-ts";
import { BaseThreeComponent } from "../base-three.component";

enum HouseParts {
  walls = "walls",
}
@Component({
  selector: "app-three-house",
  templateUrl: "./three-house.component.html",
  styleUrls: ["./three-house.component.scss"],
})
export class ThreeHouseComponent
  extends BaseThreeComponent<HouseParts>
  implements AfterViewInit, OnDestroy
{
  modelName = "House3D";
  keys = Object.keys(HouseParts);

  constructor(
    public threeService: ThreeService,
    public houseService: HouseService,
    public host: ElementRef,
    public appService: AppService,
    public cookieService: CookieService
  ) {
    super(threeService, houseService, host, appService, cookieService);
  }

  AfterViewInitCallback() {
    this.threeService.basicGround(this.scene, 0);
    // this.debugMeasureBlock();
    this.houseBlock();

    const s = this.house.stramien.out;
    // this.roofClip([s.we.a, s.ns.b]);

    this.yoyo(HouseParts.walls);
    const axesHelper = new THREE.AxesHelper(10);
    axesHelper.position.set(0, 0, 0);
    this.scene.add(axesHelper);
  }

  // debugMeasureBlock() {
  //   const mesh = this.threeService.createCube({
  //     material: Material.concrete,
  //     whd: [1, 1, 1],
  //     xyz: [0, 0, 0],
  //   });
  //   this.scene.add(mesh);
  // }

  // clipGroup(mesh: THREE.Mesh, clipOrGroup: THREE.Group | THREE.Mesh) {
  //   let newMesh;

  //   this.scene.add(clipOrGroup.clone());
  //   if (clipOrGroup instanceof THREE.Group) {
  //     clipOrGroup.children.forEach((clip: THREE.Mesh) => {
  //       clip.updateMatrixWorld()
  //       // clip.updateMatrix();
  //       if (newMesh === undefined) {
  //         newMesh = mesh;
  //       } else {
  //         newMesh = this.clip(mesh, clip);
  //       }
  //       // this.scene.add(clip.clone())
  //     });
  //     console.log(1, clipOrGroup);
  //   } else {
  //     console.log(2, clipOrGroup);
  //   }
  //   return newMesh;
  // }
  clipper(meshOrGroup: THREE.Group | THREE.Mesh, clipOrGroup: THREE.Mesh) {
    if (meshOrGroup instanceof THREE.Group) {
      meshOrGroup.children = meshOrGroup.children.map((mesh: any) => {
        return this.clip(mesh, clipOrGroup);
      });
    } else {
      return this.clip(meshOrGroup, clipOrGroup);
    }
  }

  houseBlock() {
    const key = HouseParts.walls;
    const NS = this.house.stramien.out.ns;
    const WE = this.house.stramien.out.we;

    const clip = this.roofClip();

    const create = ([ns1, ns2]: xy, [we1, we2]: xy) => {
      const x = we2 - we1;
      const y = ns2 - ns1;
      const z = this.cross.elevations[RoofPoint.topOutside];
      const origin: xy = [we1, ns1];
      const clipClone = clip;
      // clipClone.position.set(origin[0], 0, origin[1]);
      this.scene.add(clipClone);
      const mesh = this.clipper(
        this.threeService.createCube({
          material: Material.facade,
          whd: [x, z, y],
          xyz: [origin[0], 0, origin[1]],
        }),
        clipClone
      );
      // this.clip(mesh, this.roofClip(origin));

      return mesh;
    };

    this.add(key, [
      create([NS.b, NS.c], [WE.a, WE.b]),
      // create([NS.b, NS.c], [WE.b, WE.c]),
      // create([NS.b, NS.c], [WE.c, WE.d]),
      // create([NS.a, NS.b], [WE.b, WE.c]),
      // create([NS.c, NS.d], [WE.b, WE.c]),
    ]);
    // this.add(key, [create([NS.c, NS.d], [WE.b, WE.c])]);
  }

  roofClip() {
    const key = HouseParts.walls;

    const group = new THREE.Group();

    let union;
    const lowerAndUpper = [
      this.cross.roofPoints[RoofPoint.lowestOutside],
      this.cross.roofPoints[RoofPoint.bendOutside],
      this.cross.roofPoints[RoofPoint.topOutside],
      this.cross.roofPoints[RoofPoint.bendOutside],
      this.cross.roofPoints[RoofPoint.lowestOutside],
    ].map((x, i, arr) => {
      if (i === arr.length - 1) return;

      const angle = angleBetween(arr[i], arr[i + 1]);
      const length = getDiagonal(arr[i], arr[i + 1]);
      const rightSide = i >= 2;
      const origin = rightSide
        ? [this.house.outerBase - arr[i + 1][0], arr[i + 1][1]]
        : arr[i + 1];

      const mesh = this.threeService.createCube({
        material: Material.concrete,
        whd: [10, length, 5],
      });
      mesh.scale.set(1, 2, 1);

      let rotation = new THREE.Matrix4().makeRotationX(
        degToRad(rightSide ? angle - 90 - 180 : 90 - angle - 180)
      );
      mesh.applyMatrix4(
        rotation.setPosition(new THREE.Vector3(-0.1, origin[1], origin[0]))
      );

      if (union === undefined) {
        union = mesh;
      } else {
        union = CSG.union(union, mesh);
      }
      return mesh;
      // group.add(mesh);
    });

    // const combined =
    // combined.translateZ(-this.house.outerBase / 2);
    // const clone = combined.clone()
    // // clone.scale.set(1, 1, -1);
    // combined.translateZ(-this.house.outerBase / 2);

    // // const full =  CSG.union(combined,clone)
    // // // const clone = group.clone();
    // // full.position.set(0, 0, -this.house.outerBase / 2);
    // // // clip.add(...[group, clone]);
    // const s = this.house.stramien.out
    // union.position.set(s.we.a, 0,s.ns.b);
    // this.add(key, [union]);
    // this.scene.add(union)
    // return group;
    return union;
  }
}
