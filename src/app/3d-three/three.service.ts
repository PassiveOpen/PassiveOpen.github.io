import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import * as THREE from "three";
import { CSG } from "three-csg-ts";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { degToRad } from "three/src/math/MathUtils";
import { Axis } from "../components/enum.data";
import { xy, xyz } from "../house/house.model";
import { getAxis, round } from "../shared/global-functions";
import { BehaviorSubject, filter, map, startWith, Subject, tap } from "rxjs";
import {
  Material,
  Texture,
  ThreeMaterialService,
} from "./three-material.service";
import { AppService } from "../app.service";

export interface CubeProperties {
  material?: Material;
  whd: xyz;
  xyz?: xyz;
}
export interface PlaneProperties {
  material?: Material;
  coords: xy[];
  xyz?: xyz;
}

@Injectable({
  providedIn: "root",
})
export class ThreeService {
  textures: { [key in Texture]?: THREE.Texture } = {};
  cameraPerspective = true;
  update$ = new Subject<void>();

  constructor(
    private threeMaterialService: ThreeMaterialService,
    private cookieService: CookieService,
    private httpClient: HttpClient,
    private appService: AppService
  ) {}

  swapCamera() {
    this.cameraPerspective = !this.cameraPerspective;
    this.update$.next(undefined);
  }

  filter(mesh: THREE.Mesh, wallDetail: string) {
    mesh.children.forEach((c) => {
      console.log(c.name, wallDetail);

      if (c.name.includes(wallDetail)) {
        c.visible = true;
      } else {
        c.visible = false;
      }
    });
  }
  lights(scene: THREE.Scene, scale = 1) {
    const glight = new THREE.AmbientLight(0xffffff, 0.8 * scale);
    scene.add(glight);

    const light = new THREE.DirectionalLight(0xffffff, 0.4 * scale);
    light.position.set(30, 30, 30);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;

    const i = 3;
    light.shadow.mapSize.width = 512 * 4; // default
    light.shadow.mapSize.height = 512 * 4; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 500; // default

    var side = 30;
    light.shadow.camera.top = side;
    light.shadow.camera.bottom = -side;
    light.shadow.camera.left = side;
    light.shadow.camera.right = -side;

    scene.add(light);
  }

  unionAll(meshes: THREE.Mesh<any>[]): THREE.Mesh<any> {
    let union = meshes[0];
    meshes.forEach((mesh) => {
      if (mesh === undefined) return;
      mesh.updateMatrix();
      if (mesh === union) return;
      union = CSG.union(union, mesh);
    });
    return union;
  }

  flatShape(
    coords: xy[],
    z = 0,
    materials = [Material.insulation],
    depth
  ): THREE.Mesh {
    if (coords.length < 3) return;
    const shape = new THREE.Shape();
    const start = coords[0];
    shape.moveTo(0, 0);
    coords.forEach((c) => {
      shape.lineTo(c[0] - start[0], c[1] - start[1]);
    });
    shape.lineTo(0, 0);

    const extrudeSettings = {
      steps: 2,
      depth,
      bevelEnabled: false,
    };
    const material = materials.flatMap((x) =>
      this.threeMaterialService.getMaterial(x, materials.length > 1)
    );

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotateX(Math.PI / 2);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.translate(mesh, start[0], z, start[1]);

    return mesh;
  }

  translate(item: THREE.Object3D, x, y, z) {
    item.applyMatrix4(new THREE.Matrix4().makeTranslation(x, y, z));
  }

  createPane(planeProperties: PlaneProperties) {
    const { material, coords, xyz } = planeProperties;
    const shape = new THREE.Shape();
    const start = coords[0];
    shape.moveTo(0, 0);
    coords.forEach((c) => {
      shape.lineTo(c[0] - start[0], c[1] - start[1]);
    });
    shape.lineTo(0, 0);

    const geometry = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(
      geometry,
      this.threeMaterialService.getMaterial(material)[0]
    );
    this.translate(mesh, xyz[0], xyz[1], xyz[2]);
    return mesh;
  }

  createCube(cubeProperties: CubeProperties) {
    const { material, whd, xyz } = cubeProperties;
    const [width, height, depth] = whd;
    const [x, y, z] = xyz || [0, 0, 0];

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(
      geometry,
      this.threeMaterialService.getMaterial(material)
    );
    mesh.position.set(width / 2 + x, height / 2 + y, depth / 2 + z);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // var uvAttribute = geometry.attributes["uv"];
    // for (var i = 0; i < uvAttribute.count; i++) {
    //   var u = uvAttribute.getX(i);
    //   var v = uvAttribute.getY(i);
    //   v *= 2;
    //   uvAttribute.setXY(i, u, v);
    // }
    // uvAttribute.needsUpdate = true;
    return mesh;
  }

  //threejstest.glb
  importGLTF(name, callback) {
    var loader = new GLTFLoader();
    loader.load(`/assets/models/${name}`, (gltf: GLTF) => {
      const mesh = gltf.scene;
      mesh.children.forEach((c) => {
        c.castShadow = true;
        c.receiveShadow = true;
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = name;
      callback(mesh);
    });
  }
  importOBJ(scene: THREE.Scene, name, callback) {
    var loader = new OBJLoader();
    loader.load(`/assets/models/${name}`, (mesh) => {
      mesh.children.forEach((c) => {
        c.castShadow = true;
        c.receiveShadow = true;
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = name;
      callback(mesh);
    });
  }

  basicGround(scene: THREE.Scene, y: number) {
    const size = 100;
    const plane = new THREE.PlaneGeometry(size, size, 1, 1);
    const material = this.threeMaterialService.getMaterial(Material.whiteWood);
    const mesh = new THREE.Mesh(plane, material[0]);
    mesh.position.set(0, y, 0);
    mesh.rotateX(-Math.PI / 2);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  rotateAroundAxis(
    obj,
    radians,
    axis: Axis = Axis.green,
    point = new THREE.Vector3(0, 0, 0)
  ) {
    var q = new THREE.Quaternion();
    q.setFromAxisAngle(getAxis(axis), radians);
    obj.applyQuaternion(q);
    obj.position.sub(point);
    obj.position.applyQuaternion(q);
    obj.position.add(point);
  }
}
