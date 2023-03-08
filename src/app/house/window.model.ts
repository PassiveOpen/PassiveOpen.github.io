export class Window {
  height = 1200 / 1000;
  width = 800 / 1000;
  bottom = 1200 / 1000;

  roughHeight: number;
  roughHeightOSB: number;
  roughWidth: number;
  roughWidthOSB: number;

  roughBottom: number;
  roughBottomOSB: number;
  roughTop: number;
  roughTopOSB: number;

  top: number;

  thicknessOSB = 15 / 1000;
  gap = 100 / 1000;

  constructor(data: Partial<Window>) {
    Object.assign(this, data);

    this.top = this.bottom + this.height;

    this.roughHeight = this.height + this.gap * 2;
    this.roughHeightOSB = this.roughHeight + this.thicknessOSB * 2;

    this.roughWidth = this.width + this.gap * 2;
    this.roughWidthOSB = this.roughWidth + this.thicknessOSB * 2;

    this.roughBottom = this.bottom - this.gap;
    this.roughBottomOSB = this.roughBottom - this.thicknessOSB;

    this.roughTop = this.top + this.gap;
    this.roughTopOSB = this.roughTop + this.thicknessOSB;
  }
}
