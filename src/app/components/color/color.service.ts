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
  color: { [key in Color]?: string } = {};
}
