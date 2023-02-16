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
  ral9016 = "ral9016",
  normals = "normals",
  unknown = "unknown",
  roof = "roof",
  wireFrame = "wireFrame",
}

export enum Texture {
  hollowCoreSlap = "hollowCoreSlap",
  hollowCoreSlapSide = "hollowCoreSlapSide",
  hollowCoreSlapPlain = "hollowCoreSlapPlain",
  foam = "foam",
  gips = "gips",
  pine = "pine",
  concrete = "concrete",
  osb = "osb",
  whiteWood = "whiteWood",
  insulation = "insulation",
  roof = "roof",
}

export interface CubeProperties {
  material?: Material;
  whd: xyz;
  xyz?: xyz;
}

const textures = [
  {
    key: Texture.hollowCoreSlap,
    url: "assets/textures/hollowCoreSlapPlain.jpg",
    offset: [0, 0],
    scale: [0.3, 0.3],
  },
  {
    key: Texture.hollowCoreSlapSide,
    url: "assets/textures/hollowCoreSlapSide.jpg",
  },
  {
    key: Texture.foam,
    url: "assets/textures/foam.jpg",
  },
  {
    key: Texture.gips,
    url: "assets/textures/gips.jpg",
  },
  {
    key: Texture.pine,
    url: "assets/textures/western-yellow-pine.jpg",
  },
  {
    key: Texture.concrete,
    url: "assets/textures/hollowCoreSlapPlain.jpg",
  },
  {
    key: Texture.whiteWood,
    url: "assets/textures/whiteWood.jpg",
  },
  {
    key: Texture.osb,
    url: "assets/textures/osb.jpg",
  },
  {
    key: Texture.insulation,
    url: "assets/textures/insulation.png",
  },
  {
    key: Texture.roof,
    url: "assets/textures/roof.png",
    rotation: 90,
    scale: [0.4, 0.4],
  },
];

@Injectable({
  providedIn: "root",
})
export class ThreeService {
  colors: { [key: number]: string } = {};
  textures: { [key in Texture]?: THREE.Texture } = {};

  constructor(
    private cookieService: CookieService,
    private httpClient: HttpClient
  ) {
    [0, 5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100].forEach((i) => {
      this.colors[i] = getComputedStyle(document.body)
        .getPropertyValue(`--color-${i}`)
        .trim();
    });
    this.generateTextures();
  }

  generateTextures() {
    textures.forEach((obj) => {
      var image = new Image();
      var texture = new THREE.Texture();
      texture.image = image;
      image.onload = function () {
        if (!obj.scale) obj.scale = [1, 1];
        if (!obj.offset) obj.offset = [0, 0];

        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.offset.set(obj.offset[0], obj.offset[1]);
        texture.repeat.set(obj.scale[0], obj.scale[1]);

        if (obj.rotation) texture.rotation = degToRad(obj.rotation);
        texture.needsUpdate = true;
      };
      this.textures[obj.key] = texture;

      this.httpClient
        .get(obj.url, {
          responseType: "arraybuffer",
          headers: {
            "cache-control": "private, max-age=3600",
          },
        })
        .subscribe((data) => {
          const byteArray = new Uint8Array(data);
          this.cookieService.set(
            `texture-${obj.key}`,
            `${JSON.stringify(byteArray).slice(0, 100)}`
          );
          var imageBlob = new Blob([byteArray.buffer], { type: "image/png" });
          var url = URL.createObjectURL(imageBlob);
          this.textures[obj.key].image.src = url;
        });
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
  lights(scene: THREE.Scene, scale = 1) {
    const glight = new THREE.AmbientLight(0xffffff, 0.8 * scale);
    scene.add(glight);

    const light = new THREE.DirectionalLight(0xffffff, 0.4 * scale);
    light.position.set(30, 30, 30);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;

    light.shadow.mapSize.width = 512 * 2; // default
    light.shadow.mapSize.height = 512 * 2; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 500; // default

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
      this.getMaterial(x, materials.length > 1)
    );

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotateX(Math.PI / 2);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.translate(mesh, start[0], z, start[1]);

    return mesh;
  }

  getMaterial(material: Material, returnOne = false) {
    let mat: THREE.Material[] = [
      new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
    ];
    if (material === Material.pine) {
      mat = [
        new THREE.MeshLambertMaterial({ map: this.textures[Texture.pine] }),
      ];
    }
    if (material === Material.ral9016) {
      mat = [
        new THREE.MeshLambertMaterial({
          color: 0xaaaaaa,
          bumpMap: this.textures[Texture.pine],
          bumpScale: 0.05,
        }),
      ]; //0xedede6
    }

    if (material === Material.normals) {
      mat = [new THREE.MeshNormalMaterial({})];
    }
    if (material === Material.roof) {
      mat = [
        new THREE.MeshLambertMaterial({
          color: 0xaaaaaa,
          map: this.textures[Texture.roof],
          bumpMap: this.textures[Texture.roof],
        }),
      ];
    }
    if (material === Material.wireFrame) {
      mat = [
        new THREE.MeshLambertMaterial({
          wireframe: true,
        }),
      ];
    }

    if (material === Material.whiteWood) {
      mat = [
        new THREE.MeshLambertMaterial({
          map: this.textures[Texture.whiteWood],
        }),
      ];
    }
    if (material === Material.osb) {
      mat = [
        new THREE.MeshLambertMaterial({ map: this.textures[Texture.osb] }),
      ];
    }
    if (material === Material.hollowCoreSlap) {
      const side = this.textures[Texture.hollowCoreSlapSide].clone();
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
        new THREE.MeshLambertMaterial({
          map: this.textures[Texture.hollowCoreSlapSide],
        }), // left
        new THREE.MeshLambertMaterial({
          map: this.textures[Texture.hollowCoreSlapSide],
        }), //right
        new THREE.MeshLambertMaterial({ map: top }), // top
        new THREE.MeshLambertMaterial({ map: this.textures[Texture.foam] }), //bottom
        new THREE.MeshLambertMaterial({
          map: this.textures[Texture.hollowCoreSlap],
        }), //back
        new THREE.MeshLambertMaterial({
          map: this.textures[Texture.hollowCoreSlap],
        }), //front
      ];
    }
    if (material === Material.gips) {
      mat = [
        new THREE.MeshLambertMaterial({ map: this.textures[Texture.gips] }),
      ];
    }
    if (material === Material.ground) {
      mat = [new THREE.MeshLambertMaterial({ color: this.colors[10] })];
    }
    if (material === Material.concrete) {
      mat = [
        new THREE.MeshLambertMaterial({
          map: this.textures[Texture.hollowCoreSlapPlain],
        }),
      ];
    }
    if (material === Material.tape) {
      mat = [new THREE.MeshLambertMaterial({ color: 0x777777 })];
    }

    if (material === Material.foam) {
      mat = [
        new THREE.MeshLambertMaterial({ map: this.textures[Texture.foam] }),
      ];
    }
    if (material === Material.insulation) {
      mat = [
        new THREE.MeshLambertMaterial({
          map: this.textures[Texture.insulation],
        }),
      ];
    }
    if (material === Material.outerSheet) {
      const m = new THREE.MeshLambertMaterial({
        map: this.textures[Texture.insulation],
      });
      mat = [m];
      m.color = new THREE.Color(0x613d1a);
    }
    if (material === Material.facade) {
      const m = new THREE.MeshLambertMaterial({
        map: this.textures[Texture.pine],
      });
      mat = [m];
      m.color = new THREE.Color(0x801818);
    }

    if (mat.length === 1)
      mat = [mat[0], mat[0], mat[0], mat[0], mat[0], mat[0]];
    mat.forEach((x) => {
      x.transparent = true;
      x.needsUpdate = true;
    });
    if (returnOne) return mat[0];
    // mat.depthWrite = false;
    return mat;
  }

  translate(item: THREE.Mesh | THREE.Group, x, y, z) {
    item.applyMatrix4(new THREE.Matrix4().makeTranslation(x, y, z));
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
