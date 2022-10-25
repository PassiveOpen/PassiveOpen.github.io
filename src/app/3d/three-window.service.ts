import { Injectable } from "@angular/core";
import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { degToRad } from "three/src/math/MathUtils";
import { xyz } from "../house/house.model";
import { round } from "../shared/global-functions";

export enum Material {
  ground = "ground",
  pine = "pine",
  osb = "osb",
  gips = "gips",
  insulation = "insulation",
  outerSheet = "outerSheet",
  facade = "facade",
  tape = "tape",
  foam = "foam",
  hollowCoreSlap = "hollowCoreSlap",
  concrete = "concrete",
  whiteWood = "whiteWood",
}

export interface CubeProperties {
  material?: Material;
  whd: xyz;
  xyz?: xyz;
}

@Injectable({
  providedIn: "root",
})
export class ThreeService {
  colors: { [key: number]: string } = {};
  textureHollowCoreSlap = new THREE.TextureLoader().load(
    "assets/textures/hollowCoreSlap.jpg"
  );
  textureHollowCoreSlapSide = new THREE.TextureLoader().load(
    "assets/textures/hollowCoreSlapSide.jpg"
  );
  textureHollowCoreSlapPlain = new THREE.TextureLoader().load(
    "assets/textures/hollowCoreSlapPlain.jpg"
  );
  textureFoam = new THREE.TextureLoader().load("assets/textures/foam.jpg");
  textureGips = new THREE.TextureLoader().load("assets/textures/gips.jpg");
  texturePine = new THREE.TextureLoader().load(
    "assets/textures/western-yellow-pine.jpg"
  );
  textureWhiteWood = new THREE.TextureLoader().load(
    "assets/textures/whiteWood.jpg"
  );

  constructor() {
    [0, 5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100].forEach((i) => {
      this.colors[i] = getComputedStyle(document.body)
        .getPropertyValue(`--color-${i}`)
        .trim();
    });
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
  lights(scene: THREE.Scene) {
    const glight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(glight);

    const light = new THREE.DirectionalLight(0xffffff, 0.4);
    light.position.set(30, 30, 30);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;

    light.shadow.mapSize.width = 512 * 2; // default
    light.shadow.mapSize.height = 512 * 2; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 500; // default

    scene.add(light);
  }
  createSimpleMesh(scene: THREE.Scene): THREE.Mesh {
    const x = 0,
      y = 0;

    const heartShape = new THREE.Shape();

    heartShape.moveTo(x + 5, y + 5);
    heartShape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
    heartShape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
    heartShape.bezierCurveTo(x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19);
    heartShape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
    heartShape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
    heartShape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);

    // const geometry = new THREE.ExtrudeGeometry(heartShape, {
    //   steps: 2,
    //   depth: 16,
    //   bevelEnabled: true,
    //   bevelThickness: 1,
    //   bevelSize: 1,
    //   bevelOffset: 0,
    //   bevelSegments: 1,
    // });
    const geometry = new THREE.ShapeGeometry(heartShape);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  getMaterial(material: Material) {
    let mat = [new THREE.MeshLambertMaterial({ color: 0x00ff00 })];
    if (material === Material.pine) {
      mat = [new THREE.MeshLambertMaterial({ map: this.texturePine })];
    }
    if (material === Material.whiteWood) {
      const map = this.textureWhiteWood;

      mat = [new THREE.MeshLambertMaterial({ map })];
    }
    if (material === Material.osb) {
      const texture = new THREE.TextureLoader().load("assets/textures/osb.jpg");
      texture.matrixAutoUpdate = false;
      mat = [new THREE.MeshLambertMaterial({ map: texture })];
    }
    if (material === Material.hollowCoreSlap) {
      const side = this.textureHollowCoreSlapSide.clone();
      side.rotation = degToRad(90);
      side.wrapS = THREE.RepeatWrapping;
      side.wrapT = THREE.RepeatWrapping;
      side.offset.set(0.2, 1);
      side.repeat.set(4, 4);

      const top = new THREE.TextureLoader().load(
        "assets/textures/hollowCoreSlapPlain.jpg"
      );
      top.wrapS = THREE.RepeatWrapping;
      top.wrapT = THREE.MirroredRepeatWrapping;
      top.repeat.set(1, 1.8);
      mat = [
        new THREE.MeshLambertMaterial({ map: this.textureHollowCoreSlapSide }), // left
        new THREE.MeshLambertMaterial({ map: this.textureHollowCoreSlapSide }), //right
        new THREE.MeshLambertMaterial({ map: top }), // top
        new THREE.MeshLambertMaterial({ map: this.textureFoam }), //bottom
        new THREE.MeshLambertMaterial({ map: this.textureHollowCoreSlap }), //back
        new THREE.MeshLambertMaterial({ map: this.textureHollowCoreSlap }), //front
      ];
    }
    if (material === Material.gips) {
      this.textureGips.matrixAutoUpdate = false;
      mat = [new THREE.MeshLambertMaterial({ map: this.textureGips })];
    }
    if (material === Material.ground) {
      mat = [new THREE.MeshLambertMaterial({ color: this.colors[10] })];
    }
    if (material === Material.concrete) {
      mat = [
        new THREE.MeshLambertMaterial({ map: this.textureHollowCoreSlapPlain }),
      ];
    }
    if (material === Material.tape) {
      mat = [new THREE.MeshLambertMaterial({ color: 0x777777 })];
    }

    if (material === Material.foam) {
      mat = [new THREE.MeshLambertMaterial({ map: this.textureFoam })];
    }
    if (material === Material.insulation) {
      const texture = new THREE.TextureLoader().load(
        "assets/textures/insulation.png"
      );
      texture.matrixAutoUpdate = false;
      mat = [new THREE.MeshLambertMaterial({ map: texture })];
    }
    if (material === Material.outerSheet) {
      const texture = new THREE.TextureLoader().load(
        "assets/textures/insulation.png"
      );
      texture.matrixAutoUpdate = false;
      mat = [new THREE.MeshLambertMaterial({ map: texture })];
      mat[0].color = new THREE.Color(0x613d1a);
    }
    if (material === Material.facade) {
      const texture = new THREE.TextureLoader().load(
        "assets/textures/western-yellow-pine.jpg"
      );
      texture.matrixAutoUpdate = false;
      mat = [new THREE.MeshLambertMaterial({ map: texture })];
      mat[0].color = new THREE.Color(0x801818);
    }
    if (mat.length === 1)
      mat = [mat[0], mat[0], mat[0], mat[0], mat[0], mat[0]];
    mat.forEach((x) => {
      x.transparent = true;
      x.needsUpdate = true;
    });
    // mat.depthWrite = false;
    return mat;
  }

  createCube(cubeProperties: CubeProperties) {
    const { material, whd, xyz } = cubeProperties;
    const [width, height, depth] = whd;
    const [x, y, z] = xyz || [0, 0, 0];

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const cube = new THREE.Mesh(geometry, this.getMaterial(material));
    cube.position.set(width / 2 + x, height / 2 + y, depth / 2 + z);

    cube.castShadow = true;
    cube.receiveShadow = true;

    // var uvAttribute = geometry.attributes["uv"];
    // for (var i = 0; i < uvAttribute.count; i++) {
    //   var u = uvAttribute.getX(i);
    //   var v = uvAttribute.getY(i);
    //   v *= 2;
    //   uvAttribute.setXY(i, u, v);
    // }
    // uvAttribute.needsUpdate = true;
    return cube;
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
      scene.add(mesh);
      callback(mesh);
    });
  }

  basicGround(scene: THREE.Scene, y: number) {
    const size = 100;
    const plane = new THREE.PlaneGeometry(size, size, 1, 1);
    const material = this.getMaterial(Material.whiteWood);
    const mesh = new THREE.Mesh(plane, material[0]);
    mesh.position.set(0, y, 0);
    mesh.rotateX(-Math.PI / 2);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
}
