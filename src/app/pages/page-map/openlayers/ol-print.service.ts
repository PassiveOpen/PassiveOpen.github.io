import { Injectable } from "@angular/core";
import { Feature, ImageCanvas, Map, MapBrowserEvent } from "ol";
import { LineString, Point, Polygon } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { BehaviorSubject, Subscription, fromEvent } from "rxjs";
import { fromExtent } from "ol/geom/Polygon";
import { Coordinate } from "ol/coordinate";
import { Translate } from "ol/interaction";
import { Fill, Stroke, Style } from "ol/style";
import { Color, ColorService } from "src/app/components/color/color.service";
import html2canvas from "html2canvas";
import { Options } from "html2canvas";
import jsPDF from "jspdf";
import ImageLayer from "ol/layer/Image";
import { getVectorContext, toContext } from "ol/render";
import CircleStyle from "ol/style/Circle";

export interface PrintOptions {
  paperSize: [number, number];
  scale: number;
  center: Coordinate;
}

const exportOptions: Partial<Options> = {
  useCORS: true,
  ignoreElements: function (element) {
    const className = element.className || "";
    return (
      className.includes("ol-control") &&
      !className.includes("ol-scale") &&
      (!className.includes("ol-attribution") ||
        !className.includes("ol-uncollapsible"))
    );
  },
};

const PaperSize = {
  A4: [297, 210],
  A3: [420, 297],
};

@Injectable({
  providedIn: "root",
})
export class OLPrintService {
  subscriptions: Subscription[] = [];
  map: Map;
  highlight = false;
  printing = false;
  geometry = new Polygon([]);
  feature = new Feature(this.geometry);
  source = new VectorSource({ features: [this.feature] });
  layer = new VectorLayer({
    source: this.source,
    style: (f, r) => this.printStyle(f, r),
    zIndex: 1000,
  });

  paperSizeKey = "A4";
  paperSize = PaperSize[this.paperSizeKey];
  scale = 1000;
  padding = 40;
  center: Coordinate;

  active$ = new BehaviorSubject(false);
  translate: Translate;
  texts = [
    { text: "↑", size: 32, offset: [120, -60] },
    { text: "Förhandsbesked", size: 14, offset: [20, -4] },
    { text: "Lindelund", size: 16, offset: [20, 40] },
    { text: "2023-04-14 V1", size: 12, offset: [20, 60] },
    {
      text: `Scala 1:${this.scale} (${this.paperSizeKey})`,
      size: 12,
      offset: [20, 80],
    },
  ];

  init(map: Map) {
    this.map = map;
    // console.clear();
    // this.startPrint();
    // setTimeout(() => {
    //   this.print();
    // }, 1000);
  }
  constructor(private colorService: ColorService) {}

  onDestroy() {
    this.active$.next(false);
    this.map.removeLayer(this.layer);
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.map.removeInteraction(this.translate);
    this.printing = false;
    this.map.getInteractions().forEach((x) => x.setActive(true));
  }

  startPrint(printOptions: Partial<PrintOptions> = {}) {
    if (printOptions.paperSize) this.paperSize = printOptions.paperSize;
    if (printOptions.scale) this.scale = printOptions.scale;
    if (printOptions.center) {
      this.center = printOptions.center;
    } else {
      console.log("fallen back on map center");

      this.center = this.map.getView().getCenter();
    }
    this.active$.next(true);
    this.addLayer();
  }

  print() {
    this.printing = true;
    console.log("pdf saved");
    this.map.getInteractions().forEach((x) => x.setActive(false));
    const filename = `map.pdf`;

    const scale = 1; //300/72
    const viewEl = this.map.getViewport();
    const mapEl = this.map.getTargetElement();

    const size = this.map.getSize();
    const ratioPaper = this.paperSize[0] / this.paperSize[1];
    const ratioMap = size[0] / size[1];

    let width, height;
    if (ratioMap < ratioPaper) {
      width = scale * size[0];
      height = width / ratioPaper;
    } else {
      height = scale * size[1];
      width = height * ratioPaper;
    }
    viewEl.style.width = `${width}px`;
    viewEl.style.height = `${height}px`;
    mapEl.style.width = `${width}px`;
    mapEl.style.height = `${height}px`;
    mapEl.style.zIndex = `999999`;
    mapEl.style.pointerEvents = `none`;
    viewEl.style.pointerEvents = `none`;
    this.map.updateSize();

    // viewEl.style.transform = `scale(${1 / scale})`;
    exportOptions.scale = scale;

    this.zoomToPrint(false);

    // return;
    // this.map.once("rendercomplete", () => {
    //   html2canvas(mapEl, exportOptions).then(async (canvas) => {
    //     canvas = mapEl.querySelector("canvas");
    //     console.log(" starting exporting pdf", canvas);

    //     const pdf = new jsPDF({
    //       orientation: "landscape",
    //       unit: "mm",
    //       format: [this.paperSize[0], this.paperSize[1]],
    //     });
    //     pdf.addImage(
    //       canvas.toDataURL("image/png"),
    //       "png",
    //       0,
    //       0,
    //       this.paperSize[0],
    //       this.paperSize[1]
    //     );
    //     // pdf.save(filename);

    //     await pdf.save(filename, { returnPromise: true });
    //     //@ts-ignore
    //     window.open(pdf.output("bloburl", { filename }), "_blank");
    //     console.log("pdf saved");
    //   });
    // });
    setTimeout(() => {
      this.layer.on("postrender", (e) => {
        const vectorContext = getVectorContext(e);
        //@ts-ignore
        this.addLabel(vectorContext.context_, scale, this.map.pixelRatio_);
      });
      this.layer.changed();
    }, 1000);
  }

  addLabel(ctx: CanvasRenderingContext2D, scale, ratio) {
    const [w, h] = [200, 100];
    const [x, y] = [ctx.canvas.width, ctx.canvas.height];
    const offsetX = (xx) => x - ratio * w + xx * ratio;
    const offsetY = (yy) => y - ratio * h + yy * ratio;

    this.addCTXrect(ctx, ratio, [
      offsetX(0),
      offsetY(0),
      ratio * (w - 1),
      ratio * (h - 1),
    ]);
    this.texts.forEach((x) => {
      this.addCTXtext(
        ctx,
        [offsetX(x.offset[0]), offsetY(x.offset[1])],
        x.text,
        x.size * ratio
      );
    });
  }

  addCTXtext(ctx: CanvasRenderingContext2D, coords, text, size = 16) {
    ctx.font = `${size}pt Roboto`;
    ctx.fillStyle = this.colorService.rgb(Color.color100);
    ctx.fillText(text, coords[0], coords[1]);
  }
  addCTXrect(ctx: CanvasRenderingContext2D, ratio, coords) {
    ctx.restore();
    ctx.beginPath();
    ctx.rect(coords[0], coords[1], coords[2], coords[3]);
    ctx.strokeStyle = this.colorService.rgb(Color.color80);
    ctx.lineWidth = 2 * ratio;
    ctx.stroke();
    ctx.fillStyle = this.colorService.rgb(Color.color0);
    ctx.fill();
  }

  addLayer() {
    this.map.addLayer(this.layer);
    this.geometry.setCoordinates(this.extentCorrected());
    this.zoomToPrint();
    this.translate = new Translate({
      // features: this.source.getFeaturesCollection(),
      layers: [this.layer],
    });
    this.map.addInteraction(this.translate);
    this.subscriptions.push(
      ...[
        fromEvent(this.map, "pointermove").subscribe(
          (e: MapBrowserEvent<MouseEvent>) => {
            let highlight = false;
            this.map.forEachFeatureAtPixel(e.pixel, (f) => {
              if (f === this.feature) highlight = true;
            });

            if (highlight !== this.highlight) {
              this.highlight = highlight;
              this.layer.changed();

              this.map.getViewport().style.cursor = this.highlight
                ? "grab"
                : "";
            }
          }
        ),
        fromEvent(this.map, "moveend").subscribe((e) => {
          this.geometry.setCoordinates(this.extentCorrected());
        }),
        fromEvent(this.translate, "translateend").subscribe((e) => {
          const extent = this.feature.getGeometry().getExtent();
          this.center = [
            (extent[0] + extent[2]) / 2,
            (extent[1] + extent[3]) / 2,
          ];
          this.map.getView().setCenter(this.center);
        }),
      ]
    );
  }

  printStyle = (feature, resolution) =>
    new Style({
      fill: new Fill({
        color: this.printing
          ? ""
          : this.highlight
          ? this.colorService.rgba(Color.accent, 0.2)
          : this.colorService.rgba(Color.color0, 0.7),
      }),
      stroke: new Stroke({
        color: this.highlight
          ? this.colorService.rgba(Color.accent, 0.8)
          : this.colorService.rgba(Color.color100, 0.8),
        width: this.printing ? 0 : this.highlight ? 2 : 1,
      }),
    });

  zoomToPrint(padding = true) {
    const a = this.getPaperPolygon();
    const p = padding ? this.padding : 0;
    const extent = [a[1], a[3]].flatMap((x) => x);
    this.map.getView().fit(extent, {
      size: this.map.getSize(),
      padding: [p, p, p, p],
    });
  }

  getPaperPolygon() {
    const view = this.map.getView();
    const metersPerUnit = view.getProjection().getMetersPerUnit();
    const resolution = this.scale / metersPerUnit;

    const size = this.paperSize.map((s) => s / 1000);

    const paperTopLeft = [
      this.center[0] - (resolution * size[0]) / 2,
      this.center[1] + (resolution * size[1]) / 2,
    ];
    const paperBottomRight = [
      this.center[0] + (resolution * size[0]) / 2,
      this.center[1] - (resolution * size[1]) / 2,
    ];

    return [
      [paperTopLeft[0], paperTopLeft[1]],
      [paperTopLeft[0], paperBottomRight[1]],
      [paperBottomRight[0], paperBottomRight[1]],
      [paperBottomRight[0], paperTopLeft[1]],
      [paperTopLeft[0], paperTopLeft[1]],
    ];
  }

  extentCorrected() {
    const view = this.map.getView();
    const extent = view.calculateExtent();

    let extentTopLeft = extent.slice(0, 2);
    extentTopLeft = [extentTopLeft[0] - 1000, extentTopLeft[1] - 4000];
    let extentBottomRight = extent.slice(2, 4);
    extentBottomRight = [
      extentBottomRight[0] + 1000,
      extentBottomRight[1] + 4000,
    ];

    const adjustedExtent = [
      [
        [extentTopLeft[0], extentTopLeft[1]],
        [extentBottomRight[0], extentTopLeft[1]],
        [extentBottomRight[0], extentBottomRight[1]],
        [extentTopLeft[0], extentBottomRight[1]],
        [extentTopLeft[0], extentTopLeft[1]],
      ],
      this.getPaperPolygon().reverse(),
    ];
    return adjustedExtent;
  }
}
