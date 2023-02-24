import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

import html2canvas from "html2canvas";
import printJS from "print-js";
import { AppService } from "../app.service";
import { Floor } from "../components/enum.data";
import { HouseService } from "../house/house.service";
import { BasicSVG } from "./base-svg.component";

@Injectable({
  providedIn: "root",
})
export class PrintService {
  constructor(
    private houseService: HouseService,
    private appService: AppService
  ) {}

  print(obj: BasicSVG) {
    console.log("Printing the SVG");

    this.prepareToPrint(obj);

    // const svg = obj.svg.node();
    // setTimeout(() => {
    //   this.saveToCavnas(svg, (canvas) => {
    //     this.openNewTap(canvas);
    //   });
    // }, 2000);
  }

  prepareToPrint(obj: BasicSVG) {
    obj.printPreview = true;
    this.appService.floor$.next(Floor.ground);
    this.appService.states$.next({
      ...this.appService.states$.value,
      measure: true,
      doors: true,
      towerFootprint: false,
      stramien: false,
      examplePlan: true,
      theoreticalWalls: false,
      grid: false,
    });
    this.appService.setDarkMode(false, false);
    obj.updateSVG(true);
    obj.setTransform("translate(0,0) scale(1)");
  }

  saveToCavnas(svg: SVGElement, callback) {
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
