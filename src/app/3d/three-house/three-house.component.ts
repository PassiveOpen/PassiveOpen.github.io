import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  HostListener,
} from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { AppService } from "src/app/app.service";
import { Cross, Elevation, RoofPoint } from "src/app/house/cross.model";
import { xy, xyz } from "src/app/house/house.model";
import { HouseService } from "src/app/house/house.service";
import {
  centerBetweenPoints,
  distanceBetweenPoints,
  offset,
  round,
} from "src/app/shared/global-functions";
import * as THREE from "three";
import { degToRad } from "three/src/math/MathUtils";
import { Material, ThreeService } from "../three.service";
import { CSG } from "three-csg-ts";
import { BaseThreeComponent } from "../base-three.component";
import {
  Axis,
  Floor,
  House3DParts,
  Section,
} from "src/app/components/enum.data";
import { Room } from "src/app/model/specific/room.model";
import gsap from "gsap";
import { Wall, WallType } from "src/app/model/specific/wall.model";
import { Footprint } from "src/app/model/specific/footprint";
import { Window } from "src/app/model/specific/window.model";
import { Door } from "src/app/model/specific/door.model";

enum RoofClip {
  inside = "inside",
  outside = "outside",
  roof = "roof",
  roofTiles = "roofTiles",
}
enum RoofOrientation {
  northSouth = "northSouth",
  westEast = "westEast",
}

@Component({
  selector: "app-three-house",
  templateUrl: "./three-house.component.html",
  styleUrls: ["./three-house.component.scss"],
})
export class ThreeHouseComponent
  extends BaseThreeComponent<House3DParts>
  implements AfterViewInit, OnDestroy
{
  modelName = "House3D";
  keys = Object.keys(House3DParts);
  roofMeshes: { [key in RoofClip]?: THREE.Mesh } = {};
  tower: THREE.Mesh;
  animationDuration = 0.1;

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
    public cookieService: CookieService
  ) {
    super(threeService, houseService, host, appService, cookieService);
  }

  AfterViewInitCallback() {
    this.threeService.basicGround(this.scene, -1);
    this.threeService.lights(this.scene, 1);
    this.clipPlane();
    this.createTowerClip();
    this.createRoofShape();
    this.createFloors();
    this.createWalls();

    const axesHelper = new THREE.AxesHelper(10);

    axesHelper.position.set(0, 0, 0);
    this.scene.add(axesHelper);
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
  debug(mesh) {
    const key = House3DParts.debug;
    mesh = mesh.clone();
    //@ts-ignore
    mesh.material = new THREE.MeshLambertMaterial({
      color: 0x00ff00,
      opacity: 0.5,
      transparent: true,
      side: THREE.DoubleSide,
    });
    this.add(key, [mesh]);
    this.scaleYInOut(key, mesh, 0.5);
  }

  debugMeasureBlock() {
    const mesh = this.threeService.createCube({
      material: Material.concrete,
      whd: [1, 1, 1],
      xyz: [0, 0, 0],
    });
    this.scene.add(mesh);
  }
  // =================== CREATE ============================

  clipPlane() {
    // this.renderer.localClippingEnabled = true;
    // const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), this.clipHeight);
    // // this.renderer.clippingPlanes = [plane];
    // const helper = new THREE.PlaneHelper(plane, 10, 0xffff00);
    // helper.position.set(0, this.clipHeight, 0);
    // this.scene.add(helper);
  }
  createTowerClip() {
    const key = House3DParts.tower;
    const coords = this.house.tower.outerCoords;
    const height = 10;
    const z = 10;
    const mesh = this.threeService.flatShape(
      coords,
      z,
      [Material.concrete],
      height
    );
    this.add(key, [mesh]);
    this.scaleYInOut(key, mesh, 0.1);
    this.tower = mesh;
    this.debug(this.tower);
  }
  createRoofShape() {
    const key = House3DParts.roof;
    const p = this.cross.roofPoints;
    const outsideCoords = [p.topOutside, p.bendOutside, p.lowestOutside];
    const insideCoords = [p.topInside, p.bendInside, p.lowestInside];
    const roofTilesCoords = [
      centerBetweenPoints(p.topOutside, p.topInside, 0.8),
      centerBetweenPoints(p.bendOutside, p.bendInside, 0.8),
      centerBetweenPoints(p.lowestOutside, p.lowestInside, 0.8),
    ].map((xy) => [round(xy[0]), round(xy[1])] as xy);
    const topOffset = distanceBetweenPoints(roofTilesCoords[0], p.topOutside);

    const mirror = (coords: xy[]) => {
      const f = coords[0];
      return [
        ...coords,
        ...coords.map((xy) => [-xy[0] + f[0] * 2, xy[1]] as xy).reverse(),
      ].map((xy) => [f[0] - xy[0], f[1] - xy[1]] as xy);
    };

    const coordsRoof = mirror([...roofTilesCoords, ...insideCoords.reverse()]);
    const coordsOutside = mirror([
      ...outsideCoords,
      ...[
        offset(p.topOutside, [0, 3]),
        offset(p.bendOutside, [-1, 3]),
        offset(p.lowestOutside, [-1, 0]),
      ].reverse(),
    ]);
    const coordsInside = mirror([
      ...insideCoords.reverse(),
      offset(p.lowestInside, [0, -1]),
    ]);
    const coordsRoofTiles = mirror([
      ...outsideCoords,
      ...roofTilesCoords.reverse(),
    ]);

    const stramienWE = this.house.stramien.out.we;
    const stramienNS = this.house.stramien.out.ns;

    const overhang = 0.8;
    const roofMeshesParts = {};

    Object.values(RoofOrientation).map((roofOrientation) => {
      roofMeshesParts[roofOrientation] = {};
      Object.values(RoofClip).map((roofClip, i) => {
        let coords, elevation;
        const length =
          roofOrientation === RoofOrientation.northSouth
            ? stramienNS.d - stramienNS.a
            : stramienWE.d - stramienWE.a;

        const move =
          roofOrientation === RoofOrientation.northSouth
            ? stramienWE.b + (stramienWE.c - stramienWE.b) / 2
            : stramienNS.b + (stramienNS.c - stramienNS.b) / 2;

        if (roofClip === RoofClip.inside) coords = coordsInside;
        if (roofClip === RoofClip.outside) coords = coordsOutside;
        if (roofClip === RoofClip.roof) coords = coordsRoof;
        if (roofClip === RoofClip.roofTiles) coords = coordsRoofTiles;

        if (roofClip === RoofClip.inside)
          elevation = this.cross.elevations[RoofPoint.topInside];
        if (roofClip === RoofClip.outside)
          elevation = this.cross.elevations[RoofPoint.topOutside];
        if (roofClip === RoofClip.roof)
          elevation = this.cross.elevations[RoofPoint.topOutside] - topOffset;
        if (roofClip === RoofClip.roofTiles)
          elevation = this.cross.elevations[RoofPoint.topOutside];

        const mesh = this.threeService.flatShape(
          coords,
          0,
          [
            [Material.unknown],
            [Material.concrete],
            [Material.ral9016],
            [Material.roof],
          ][i],
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

        roofMeshesParts[roofOrientation][roofClip] = mesh;
      });
    });

    //  Merge two roof parts
    let roofInnerMesh = this.merge(
      roofMeshesParts[RoofOrientation.northSouth][RoofClip.inside],
      roofMeshesParts[RoofOrientation.westEast][RoofClip.inside]
    );
    let roofMesh = this.merge(
      roofMeshesParts[RoofOrientation.northSouth][RoofClip.roof],
      roofMeshesParts[RoofOrientation.westEast][RoofClip.roof]
    );
    let roofOuterMesh = this.merge(
      roofMeshesParts[RoofOrientation.northSouth][RoofClip.outside],
      roofMeshesParts[RoofOrientation.westEast][RoofClip.outside]
    );
    let roofTilesMesh = this.merge(
      roofMeshesParts[RoofOrientation.northSouth][RoofClip.roofTiles],
      roofMeshesParts[RoofOrientation.westEast][RoofClip.roofTiles]
    );
    // Done with merging

    roofInnerMesh = this.merge(roofInnerMesh, this.tower);
    // The roof (remove inside)
    this.roofMeshes[RoofClip.roof] = this.clip(roofMesh, roofInnerMesh);
    // The roof tiles (remove inside)
    this.roofMeshes[RoofClip.roofTiles] = this.clip(
      roofTilesMesh,
      this.merge(roofInnerMesh, roofMesh)
    );
    // The inside of the roof
    this.roofMeshes[RoofClip.inside] = roofInnerMesh;

    const totalRoofGroup = this.group([
      this.roofMeshes[RoofClip.roof],
      this.roofMeshes[RoofClip.roofTiles],
    ]);
    const totalRoofMesh = this.merge(
      this.roofMeshes[RoofClip.roof],
      this.roofMeshes[RoofClip.roofTiles]
    );

    const roofAndOutside = this.mergeAll([
      this.roofMeshes[RoofClip.inside],
      this.roofMeshes[RoofClip.roof],
      this.roofMeshes[RoofClip.roofTiles],
    ]);

    this.roofMeshes[RoofClip.outside] = this.clip(
      this.merge(this.clip(roofOuterMesh, roofAndOutside), totalRoofMesh),
      this.tower
    );

    this.scaleYInOut(key, totalRoofGroup, 1);
    this.add(key, [
      // roofInnerMesh,
      totalRoofGroup,
      // this.roofMeshes[RoofClip.roof],
      // this.roofMeshes[RoofClip.roofTiles],
      // this.roofMeshes[RoofClip.outside]
    ]);
  }

  createFloors() {
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
      const key = obj.key;
      const z = this.cross.elevations[obj.z];
      const t = obj.t;

      const footprint = this.house.partsFlatten.find(
        (x) => x instanceof Footprint
      ) as Footprint;

      let mesh: THREE.Mesh<any> = this.threeService.flatShape(
        footprint.coords,
        z,
        [Material.concrete],
        t
      );

      const holes = this.house.partsFlatten.filter(
        (x) =>
          x instanceof Room && x.hole === true && [obj.floor].includes(x.floor)
      ) as Room[];

      holes.forEach((opening) => {
        const clipCube = this.threeService.flatShape(
          opening.coords,
          z + 1,
          [Material.unknown],
          t + 2
        );

        // this.subModels[key].push(clipCube);
        mesh = this.clip(mesh, clipCube);
      });

      this.scaleYInOut(key, mesh, 1);
      this.add(key, [mesh]);
    });
  }
  createWalls() {
    const walls = this.house.partsFlatten.filter(
      (x) => x instanceof Wall && x.theoretic === false
    ) as Wall[];

    const groundFloorLevel = this.cross.elevations[Elevation.groundFloor];
    const topFloorLevel = this.cross.elevations[Elevation.topFloor];
    const innerWallParts = [];
    const outerWallParts = [];
    walls.forEach((wall) => {
      const outer = wall.type === WallType.outer;
      const elevation = outer
        ? this.cross.elevations[Elevation.ground]
        : [Floor.all, Floor.ground].includes(wall.floor)
        ? this.cross.elevations[Elevation.groundFloor]
        : this.cross.elevations[Elevation.topFloor];
      let coords: xy[] = wall.getFootPrint();
      if (coords.length < 4) return;
      const height =
        wall.gable || wall.tower || [Floor.top, Floor.all].includes(wall.floor)
          ? this.cross.elevations[RoofPoint.topInside] - elevation
          : wall.ceiling - elevation;

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
      let wallMesh = this.threeService.flatShape(
        splitFootprint(coords, true, 1),
        height + elevation,
        [Material.ral9016],
        height
      );
      wallMesh = this.clip(wallMesh, this.roofMeshes[RoofClip.outside]);
      let wallOuter;
      if (outer) {
        wallOuter = this.threeService.flatShape(
          splitFootprint(coords, false, 1),
          height + elevation,
          [Material.facade],
          height
        );
        wallOuter = this.clip(wallOuter, this.roofMeshes[RoofClip.outside]);
      }
      // const wallClip

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
          console.log(opening);
        }
        const clipCube = this.threeService.createCube({
          material: Material.tape,
          whd: [2, height, width],
          xyz: [-1, 0, origin],
        });
        this.threeService.rotateAroundAxis(
          clipCube,
          degToRad(-opening.rotate),
          Axis.green
        );

        this.threeService.translate(clipCube, x, y, z);
        // this.subModels[key].push(clipCube);
        wallMesh = this.clip(wallMesh, clipCube);
        if (wallOuter) wallOuter = this.clip(wallOuter, clipCube);
      });
      if (outer) {
        outerWallParts.push(this.group([wallMesh, wallOuter]));
      } else {
        innerWallParts.push(this.group([wallMesh, wallOuter]));
      }
    });
    const totalOuterWall = this.group(outerWallParts);
    this.scaleYInOut(House3DParts.outerWall, totalOuterWall, 1);
    this.add(House3DParts.outerWall, [totalOuterWall]);
    const totalInnerWall = this.group(innerWallParts);
    this.scaleYInOut(House3DParts.innerWall, totalInnerWall, 1);
    this.add(House3DParts.innerWall, [totalInnerWall]);
  }
}
