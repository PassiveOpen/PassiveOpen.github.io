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
  white = "white",
  whiteWood = "whiteWood",
  ral9016 = "ral9016",
  normals = "normals",
  unknown = "unknown",
  window = "window",
  floor = "floor",
  roof = "roof",
  wireFrame = "wireFrame",
}

export enum Texture {
  hollowCoreSlap = "hollowCoreSlap",
  hollowCoreSlapSide = "hollowCoreSlapSide",
  foam = "foam",
  gips = "gips",
  pine = "pine",
  concrete = "concrete",
  osb = "osb",
  whiteWood = "whiteWood",
  insulation = "insulation",
  roof = "roof",
  fishbone = "fishbone",
}

const textures: {
  key: Texture;
  url: string;
  offset?: xy;
  scale?: xy;
  rotation?: number;
}[] = [
  {
    key: Texture.hollowCoreSlap,
    url: "assets/textures/hollowCoreSlap.jpg",
    offset: [0, 0],
    scale: [0.7, 1],
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
    key: Texture.fishbone,
    url: "assets/textures/fishbone.jpg",
    rotation: 90,
    scale: [0.6, 0.6],
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
export class ThreeMaterialService {
  colors: { [key: number]: string } = {};
  textures: { [key in Texture]?: THREE.Texture } = {};
  envTexture: THREE.Texture;

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

  getMaterial(material: Material, returnOne = false) {
    let mat: THREE.Material[] = [
      new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
    ];
    if (material === Material.pine) {
      mat = [
        new THREE.MeshLambertMaterial({ map: this.textures[Texture.pine] }),
      ];
    }
    if (material === Material.floor) {
      mat = [
        new THREE.MeshLambertMaterial({ map: this.textures[Texture.fishbone] }),
      ];
    }
    if (material === Material.ral9016) {
      mat = [
        new THREE.MeshLambertMaterial({
          color: 0xf1f0ea,
          bumpMap: this.textures[Texture.pine],
          bumpScale: 0.05,
        }),
      ]; //0xf1f0ea
    }
    if (material === Material.white) {
      mat = [
        new THREE.MeshLambertMaterial({
          color: 0xffffff,
          bumpMap: this.textures[Texture.pine],
          bumpScale: 0.05,
          // side: THREE.DoubleSide,
        }),
      ]; //0xf1f0ea
    }

    if (material === Material.normals) {
      mat = [new THREE.MeshNormalMaterial({})];
    }
    if (material === Material.roof) {
      mat = [
        new THREE.MeshLambertMaterial({
          color: 0xedede6,
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
      const side = this.textures[Texture.hollowCoreSlapSide];
      const top = this.textures[Texture.concrete];
      const ends = this.textures[Texture.hollowCoreSlap];
      const foam = this.textures[Texture.foam];
      mat = [
        new THREE.MeshLambertMaterial({
          map: side,
        }), // left
        new THREE.MeshLambertMaterial({
          map: side,
        }), //right
        new THREE.MeshLambertMaterial({ map: top }), // top
        new THREE.MeshLambertMaterial({ map: foam }), //bottom
        new THREE.MeshLambertMaterial({
          map: ends,
        }), //back
        new THREE.MeshLambertMaterial({
          map: ends,
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
      this.textures[Texture.concrete];

      mat = [
        new THREE.MeshLambertMaterial({
          map: this.textures[Texture.concrete],
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
    if (material === Material.window) {
      mat = [
        new THREE.MeshPhysicalMaterial({
          // // metalness: 0,
          // // roughness: 0,
          // // color: 0xffffff,
          // // envMap: this.envTexture,
          // envMapIntensity: 1,

          // // alphaMap: texture,
          // // envMap: hdrEquirect,
          // // envMapIntensity: 0.3,
          // // transparent: true,
          // // transmission: 0.96,
          // // opacity: 0.7,
          // reflectivity: 0.2,
          // // depthWrite: false,
          // // ior: 1.33,
          // // side: THREE.FrontSide,

          // color: 0xffffff,
          // transmission: 0.9,
          opacity: 0.5,
          // metalness: 0,
          // roughness: 0,
          // ior: 1.5,
          transparent: true,
          // specularIntensity: 1,
          // specularColor: new THREE.Color(0xffffff),
          // lightIntensity: 1,
          // exposure: 1
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
      const t = this.textures[Texture.pine];
      t.rotation = degToRad(90);
      t.repeat.set(4, 0.3);
      const m = new THREE.MeshLambertMaterial({
        map: t,
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
}
