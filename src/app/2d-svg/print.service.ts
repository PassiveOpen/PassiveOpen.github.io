import { Injectable } from "@angular/core";

import html2canvas from "html2canvas";
import { AppService } from "../app.service";
import { Floor, State } from "../components/enum.data";
import { StatesService } from "../services/states.service";
import { BasicSVGComponent } from "./base-svg.component";

@Injectable({
  providedIn: "root",
})
export class PrintService {
  constructor(
    public statesService: StatesService,
    private appService: AppService
  ) {}

  print(obj: BasicSVGComponent) {
    console.log("Printing the SVG");

    this.prepareToPrint(obj);

    // const svg = obj.svg.node();
    // setTimeout(() => {
    //   this.saveToCavnas(svg, (canvas) => {
    //     this.openNewTap(canvas);
    //   });
    // }, 2000);
  }

  prepareToPrint(obj: BasicSVGComponent) {
    obj.printPreview = true;
    this.appService.floor$.next(Floor.ground);
    console.log("prepareToPrint");

    this.statesService.states$.next({
      ...this.statesService.states$.value,
      [State.measure]: true,
      [State.doors]: true,
      [State.towerFootprint]: false,
      [State.stramien]: false,
      [State.examplePlan]: true,
      [State.theoreticalWalls]: false,
      [State.grid]: false,
    });
    this.appService.setDarkMode(false, false);
    obj.update(true);
    obj.setTransform("translate(0,0) scale(1)");
  }

  saveToCanvas(svg: SVGElement, callback) {
    const w = svg.getBoundingClientRect().width;
    const h = svg.getBoundingClientRect().height;
    html2canvas(svg.parentElement, {
      width: w,
      height: h,
    }).then(function (canvas) {
      // document.body.appendChild(canvas);
      canvas.style.position = "absolute";
      canvas.style.top = "30px";
      canvas.style.left = "30px";
      canvas.style.zIndex = "9999";
      canvas.style.border = "12px solid darkcyan";
      console.log(canvas);
      console.log(w, h);

      callback(canvas);
    });
  }

  openNewTap(canvas) {
    var image = new Image();
    image.src = canvas.toDataURL(`image/png`, 1.0);
    var w = window.open("");
    w.document.write(image.outerHTML);
  }

  // const stylesheet = new CSSStyleSheet();
  // console.log(stylesheet);

  // // const svg = this.svg.node().innerHTML;
  // // //xmlns="http://www.w3.org/2000/svg"
  // // // const blob = new Blob([svg], { type: "image/svg+xml" });

  // // var canvas = document.createElement("canvas"); // Create a Canvas element.
  // // var ctx = canvas.getContext("2d"); // For Canvas returns 2D graphic.
  // // console.log(1);

  // Canvg.from(ctx, svg); // Render SVG on Canvas.
  // // var base64 = canvas.toDataURL("image/png"); // toDataURL return DataURI as Base64 format.
  // // console.log(base64);

  // // // pdfWindow.print();

  // const svgAsXML = new DOMSerializer().serializeToString(this.svg.node());

  // // Encode it as a data string:
  // const svgData = `data:image/svg+xml,${encodeURIComponent(svgAsXML)}`;
  // const loadImage = async (url) => {
  //   const $img = document.createElement("img");
  //   $img.src = url;
  //   return new Promise((resolve, reject) => {
  //     $img.onload = () => resolve($img);
  //     $img.onerror = reject;
  //     $img.src = url;
  //   });
  // };

  // const img: any = await loadImage(svgData);
  // const $canvas = document.createElement("canvas");
  // const [w, h] = [
  //   this.svg.node().clientWidth,
  //   this.svg.node().clientHeight,
  // ];
  // $canvas.width = w;
  // $canvas.height = h;
  // $canvas.getContext("2d").drawImage(img, 0, 0, w, h);
  // console.log(dataURL);
}
