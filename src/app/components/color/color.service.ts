import { Injectable } from "@angular/core";

export enum Color {
  primary = "primary",
  accent = "accent",
  warn = "warn",

  color0 = "color-0",
  color5 = "color-5",
  color10 = "color-10",
  color15 = "color-15",
  color20 = "color-20",
  color30 = "color-30",
  color40 = "color-40",
  color50 = "color-50",
  color60 = "color-60",
  color70 = "color-70",
  color80 = "color-80",
  color90 = "color-90",
  color100 = "color-100",
}

@Injectable({
  providedIn: "root",
})
export class ColorService {
  private colors: { [key in Color]?: number[] } = {};

  add(key: Color, value: string) {
    const rgb = value.replace("rgb(", "").replace(")", "");
    this.colors[key] = rgb.split(", ").map((x) => Number(x));
  }

  rgb(color: Color): string {
    const [r, g, b] = this.colors[color];
    return `rgb(${r}, ${g}, ${b})`;
  }

  rgba(color: Color, opacity: number): string {
    const [r, g, b] = this.colors[color];
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
}
