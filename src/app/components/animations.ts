import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";

const speed = 600;
const speedExit = 300;
const delay = 0; //1800;

export const animationSlideInOut = trigger("slideInOut", [
  transition(":enter", [
    style({ transform: "translateY(100%)" }),
    animate(
      `${speed}ms ${delay}ms ease-out`,
      style({ transform: "translateY(0%)" })
    ),
  ]),
  transition(":leave", [
    animate(
      `${speedExit}ms  ease-in`,
      style({ transform: "translateY(100%)" })
    ),
  ]),
]);

export const animationFallInOut = trigger("fallInOut", [
  transition(":enter", [
    style({ transform: "translateY(-100%)" }),
    animate(
      `${speed}ms ${delay}ms ease-out`,
      style({ transform: "translateY(0%)" })
    ),
  ]),
  transition(":leave", [
    animate(
      `${speedExit}ms ease-in`,
      style({ transform: "translateY(-100%)" })
    ),
  ]),
]);

export const stateSlideIn = trigger("stateSlideIn", [
  state("false", style({ width: "0px", padding: 0, borderWidth: 0 })),
  state("true", style({ width: "*", padding: "*", borderWidth: "*" })),
  transition("* => void", [
    animate(
      "200ms ease-in",
      style({ width: "0px", padding: 0, borderWidth: 0 })
    ),
  ]),
  transition("false => true", animate("200ms ease-in")),
  transition("true => false", animate("200ms ease-out")),
]);
export const foldSlideIn = trigger("foldSlideIn", [
  state("false", style({ transform: "scaleX(0)" })),
  state("true", style({ transform: "*" })),
  transition("* => void", [
    animate("200ms ease-in", style({ transform: "scaleX(0)" })),
  ]),
  transition("false => true", animate("200ms ease-in")),
  transition("true => false", animate("200ms ease-out")),
]);

// export const stateSlideInFromLeft = trigger("stateSlideInFromLeft", [
//   state("false", style({ width: "0px", padding: 0 })),
//   state("true", style({ width: "*", padding: "*" })),
//   transition("false => true", animate("200ms ease-in")),
//   transition("true => false", animate("200ms ease-out")),
// ]);
