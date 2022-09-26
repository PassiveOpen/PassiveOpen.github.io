import { Injectable } from "@angular/core";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
@Injectable({
  providedIn: "root",
})
export class ThreeService {
  colors: { [key: number]: string } = {};

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
    // const glight = new THREE.AmbientLight(0xffffff, 0.2);
    // this.scene.add(glight);

    const skyColor = 0xb1e1ff; // light blue
    const groundColor = 0xb97a20; // brownish orange
    const hlight = new THREE.HemisphereLight(skyColor, groundColor, 0.7);
    scene.add(hlight);

    const color = 0xffffff;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, 1);
    light.position.set(30, 30, 30);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;

    light.shadow.mapSize.width = 512; // default
    light.shadow.mapSize.height = 512; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 500; // default

    scene.add(light.target);
    scene.add(light);
    // const helper = new THREE.CameraHelper( light.shadow.camera );
    // this.scene.add( helper );
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

    const geometry = new THREE.ExtrudeGeometry(heartShape, {
      steps: 2,
      depth: 16,
      bevelEnabled: true,
      bevelThickness: 1,
      bevelSize: 1,
      bevelOffset: 0,
      bevelSegments: 1,
    });
    // const geometry = new THREE.ShapeGeometry( heartShape );
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  import(scene: THREE.Scene, name, callback) {
    var loader = new GLTFLoader();
    loader.load("/assets/models/threejstest.glb", (gltf) => {
      const mesh = gltf.scene;
      // house.position.set(-3, 3.2, 3);
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

  basicGround(scene: THREE.Scene) {
    const size = 100;
    const plane = new THREE.PlaneGeometry(size, size, 1, 1);
    console.log(this.colors[50]);

    const material = new THREE.MeshBasicMaterial({ color: this.colors[10] });

    const mesh = new THREE.Mesh(plane, material);
    mesh.position.set(0, -0.5, 0);
    mesh.rotateX(-Math.PI / 2);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
}
