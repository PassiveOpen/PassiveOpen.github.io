import { Subject } from "rxjs";
import {
  Box3,
  BoxGeometry,
  BufferGeometry,
  Camera,
  DoubleSide,
  Group,
  Line,
  LineBasicMaterial,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Raycaster,
  Renderer,
  Vector2,
  Vector3,
} from "three";
import { StateObj } from "../app.service";
import { xy, xyz } from "../house/house.model";
import { offsetXYZ, round } from "../shared/global-functions";

enum Side {
  left = "left",
  right = "right",
  top = "top",
  bottom = "bottom",
  back = "back",
  front = "front",
}
const lineMaterial = new LineBasicMaterial({
  color: 0x333333,
});
const planeMaterial = new MeshBasicMaterial({
  // color: 0x00ffff,
  side: 2,
  // opacity: 0.25,
  // transparent: true,
  // wireframe: true,
  visible: false,
});
const boxMaterial = new MeshBasicMaterial({
  visible: false,
  // wireframe: true,
});
const dragMaterial = new MeshBasicMaterial({
  // color: 0x000000,
  // opacity: 0.25,
  // transparent: true,
  // side: DoubleSide,
  visible: false,
});

// declare global {
//   interface Vector2 {
//     setFromEvent: (event: any) => Vector2;
//   }
// }

// // sets this vector to the coordinates of a mouse event, uses touch event if applicable

// // calculate mouse position in normalized device coordinates

export class ClipBox extends Group {
  width = 20;
  height = 8;
  depth = 5;

  onChange$ = new Subject<void>();
  drag = false;
  controlEnabled = false;
  widthStart: number;
  heightStart: number;
  depthStart: number;
  xyz: xyz = [1, 1, 1];
  rayCaster = new Raycaster();
  camera: Camera;
  activeSide: Side | undefined = undefined;
  mouse = new Vector2(0, 0);
  edges: { [key in Side]?: Line<BufferGeometry, LineBasicMaterial> } = {};
  planes: { [key in Side]?: Mesh<PlaneGeometry, LineBasicMaterial> } = {};
  box: Mesh<BoxGeometry, MeshBasicMaterial>;
  dragPlane = new Mesh(new PlaneGeometry(1000, 1000, 1, 1), dragMaterial);
  previousSide: Side;
  startPoint = new Vector3(0, 0, 0);
  enabled: boolean;
  show: boolean;
  callbackUpdate: () => void;

  constructor() {
    super();
    this.init();
    this.startDrag = this.startDrag.bind(this);
    this.onDrag = this.onDrag.bind(this);
    this.endDrag = this.endDrag.bind(this);
  }

  init() {
    this.box = new Mesh(
      new BoxGeometry(this.width, this.height, this.depth),
      boxMaterial
    );
    this.box.userData["side"] = "box";
    this.setPosition();
    this.add(this.box);
    this.add(this.dragPlane);
    this.dragPlane.castShadow = false;
    this.dragPlane.receiveShadow = false;

    Object.keys(Side).forEach((side) => {
      this.edges[side] = new Line(new BufferGeometry(), lineMaterial.clone());
      this.edges[side].userData["side"] = side;
      this.add(this.edges[side]);

      if (side === Side.top) return;
      this.planes[side] = new Mesh(
        new PlaneGeometry(this.width, this.height, this.depth),
        planeMaterial.clone()
      );
      this.planes[side].userData["side"] = side;
      this.add(this.planes[side]);
    });
    this.drawBox();
    window.addEventListener("pointermove", (event) => {
      this.mouse = this.setToNormalizedDeviceCoordinates(
        event,
        window,
        this.mouse
      );
    });
  }
  states(states: StateObj) {
    this.enabled = states.clipBoxEnabled;
    this.show = states.clipBoxShow;
    this.drawBox();
  }

  setToNormalizedDeviceCoordinates = function (event, window, vector) {
    vector.x =
      event.clientX !== undefined
        ? event.clientX
        : event.touches && event.touches[0].clientX;
    vector.y =
      event.clientY !== undefined
        ? event.clientY
        : event.touches && event.touches[0].clientY;
    vector.x = (vector.x / window.innerWidth) * 2 - 1;
    vector.y = -(vector.y / window.innerHeight) * 2 + 1;
    return vector;
  };

  drawBox() {
    this.box.geometry.dispose();
    this.box.geometry = new BoxGeometry(this.width, this.height, this.depth);
    this.box.position.set(this.width / 2, this.height / 2, this.depth / 2);
    this.drawPlanesAroundBox();
    this.drawLinesAroundBox();
  }
  drawPlanesAroundBox() {
    const min: xyz = [this.width / 2, this.height / 2, this.depth / 2];
    const max: xyz = [this.width / 2, this.height / 2, this.depth / 2];

    Object.keys(Side).forEach((side) => {
      let geom: PlaneGeometry;
      // if (side !== Side.front) return;
      if (side === Side.front) {
        geom = new PlaneGeometry(this.width, this.height);
        geom.rotateY(0);
        geom.translate(0, 0, this.depth / 2);
      } else if (side === Side.back) {
        geom = new PlaneGeometry(this.width, this.height);
        geom.rotateY(Math.PI);
        geom.translate(0, 0, -this.depth / 2);
      }
      if (side === Side.left) {
        geom = new PlaneGeometry(this.depth, this.height);
        geom.rotateY(-Math.PI / 2);
        geom.translate(-this.width / 2, 0, 0);
      } else if (side === Side.right) {
        geom = new PlaneGeometry(this.depth, this.height);
        geom.rotateY(Math.PI / 2);
        geom.translate(this.width / 2, 0, 0);
      }
      if (side === Side.top) {
        return;
        geom = new PlaneGeometry(this.width, this.depth);
        geom.rotateX(-Math.PI / 2);
        geom.translate(0, this.height / 2, 0);
      } else if (side === Side.bottom) {
        geom = new PlaneGeometry(this.width, this.depth);
        geom.rotateX(Math.PI / 2);
        geom.translate(0, -this.height / 2, 0);
      }

      this.planes[side].geometry.dispose();
      if (this.show) {
        this.planes[side].geometry = geom;
        this.planes[side].position.set(
          this.width / 2,
          this.height / 2,
          this.depth / 2
        );
      }
    });
  }
  drawLinesAroundBox() {
    Object.keys(Side).forEach((side) => {
      if (this.planes[side] === undefined) return;
      // if (side !== Side.front) return;
      let points = Array.from(
        // @ts-ignore
        this.planes[side].geometry.attributes["position"].array as Number[]
      )
        .reduce(
          (r, e, i) => (i % 3 ? r[r.length - 1].push(e) : r.push([e])) && r,
          []
        )
        .map((x) => new Vector3(x[0], x[1], x[2]));

      if (this.show) {
        this.edges[side].geometry.setFromPoints([
          ...points.slice(0, 2),
          ...points.slice(2).reverse(),
          points[0],
        ]);
        this.edges[side].position.set(
          this.width / 2,
          this.height / 2,
          this.depth / 2
        );
      } else {
        this.edges[side].geometry.setFromPoints([]);
      }
    });
  }

  onMouseOver(
    camera: Camera,
    renderer: Renderer,
    callbackChange,
    callbackStartHover,
    callbackEndHover
  ) {
    if (!this.enabled) {
      callbackEndHover();
      return;
    }
    if (this.drag === true || this.show === false) return;
    this.camera = camera;
    this.callbackUpdate = callbackChange;
    this.rayCaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.rayCaster.intersectObjects(
      Object.values(this.planes)
    );
    if (intersects.length > 0) {
      this.activeSide = intersects[0].object.userData["side"];
    } else {
      this.activeSide = undefined;
    }

    if (this.previousSide === this.activeSide) return;
    this.previousSide = this.activeSide;

    Object.keys(Side).forEach((side) => {
      if (side === this.activeSide) {
        // this.planes[side].material.visible = true;
        this.edges[side].material.color.set(0x2ec4b6);
        this.edges[side].renderOrder = 1;
      } else {
        // this.planes[side].material.visible = false;
        this.edges[side].material.color.set(lineMaterial.color);
        this.edges[side].renderOrder = 0;
      }
    });

    const r = renderer.domElement;
    if (this.activeSide !== undefined) {
      r.addEventListener("mousedown", this.startDrag);
      r.addEventListener("mousemove", this.onDrag);
      r.addEventListener("mouseup", this.endDrag);

      callbackStartHover();
    } else {
      r.removeEventListener("mousedown", this.startDrag);
      r.removeEventListener("mousemove", this.onDrag);
      r.removeEventListener("mouseup", this.endDrag);
      callbackEndHover();
    }
  }

  startDrag(event: MouseEvent) {
    if (event.buttons !== 1) return;
    // console.log("start drag", this.activeSide);
    this.drag = true;
    this.rayCaster.setFromCamera(this.mouse, this.camera);
    var intersects = this.rayCaster.intersectObjects(
      Object.values(this.planes)
    );

    if (intersects.length > 0) {
      const point = intersects[0].point;
      this.widthStart = this.width;
      this.heightStart = this.height;
      this.depthStart = this.depth;
      this.startPoint = intersects[0].point;

      let parentPosition = new Vector3();
      this.dragPlane.parent.getWorldPosition(parentPosition);
      this.dragPlane.position.set(
        point.x - parentPosition.x,
        point.y - parentPosition.y,
        point.z - parentPosition.z
      );

      this.dragPlane.geometry.center();
      let axis = new Vector3(0, 0, 1);
      if (this.activeSide === Side.front || this.activeSide === Side.back) {
        axis = new Vector3(0, 0, 1);
      }
      if (this.activeSide === Side.left || this.activeSide === Side.right) {
        axis = new Vector3(1, 0, 0);
      }
      if (this.activeSide === Side.top || this.activeSide === Side.bottom) {
        axis = new Vector3(0, 1, 0);
      }

      var newNormal = this.camera.position
        .clone()
        .sub(this.camera.position.clone().projectOnVector(axis));
      this.dragPlane.lookAt(newNormal.add(point));
    }
  }
  onDrag(event: MouseEvent) {
    if (this.drag === false) return;
    this.rayCaster.setFromCamera(this.mouse, this.camera);
    var intersects = this.rayCaster.intersectObject(this.dragPlane);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      this.change(point);
    }
  }
  endDrag(event: MouseEvent) {
    // console.log("end drag");
    this.drag = false;
    if (event.buttons !== 0) return;
    this.onChange$.next();
  }
  change(point: Vector3) {
    if (this.activeSide === undefined) return;
    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;
    const dz = point.z - this.startPoint.z;

    if (this.activeSide === Side.right) {
      this.width = this.widthStart + dx;
    }
    if (this.activeSide === Side.top) {
      this.height = this.heightStart + dy;
    }
    if (this.activeSide === Side.front) {
      this.depth = this.depthStart + dz;
    }

    if (this.activeSide === Side.left) {
      this.width = this.widthStart - dx;
      this.xyz[0] = point.x;
    }
    if (this.activeSide === Side.bottom) {
      this.height = this.heightStart - dy;
      this.xyz[1] = point.y;
    }
    if (this.activeSide === Side.back) {
      this.depth = this.depthStart - dz;
      this.xyz[2] = point.z;
    }

    this.width = Math.max(this.width, 2);
    this.height = Math.max(this.height, 2);
    this.depth = Math.max(this.depth, 2);

    this.drawBox();
    this.setPosition();
    this.callbackUpdate();
  }
  setPosition() {
    this.position.set(this.xyz[0], this.xyz[1], this.xyz[2]);
  }

  setCookie(cookie) {
    this.height = cookie.height;
    this.width = cookie.width;
    this.depth = cookie.depth;
    this.xyz = cookie.xyz;
    this.setPosition();
  }
}
