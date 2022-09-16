import { animate, style, transition, trigger } from '@angular/animations';

const speed = 600;
const speedExit = 300;
const delay = 0; //1800;

export const animationSlideInOut = trigger('slideInOut', [
  transition(':enter', [
    style({ transform: 'translateY(100%)' }),
    animate(
      `${speed}ms ${delay}ms ease-out`,
      style({ transform: 'translateY(0%)' })
    ),
  ]),
  transition(':leave', [
    animate(
      `${speedExit}ms  ease-in`,
      style({ transform: 'translateY(100%)' })
    ),
  ]),
]);
export const animationFallInOut = trigger('fallInOut', [
  transition(':enter', [
    style({ transform: 'translateY(-100%)' }),
    animate(
      `${speed}ms ${delay}ms ease-out`,
      style({ transform: 'translateY(0%)' })
    ),
  ]),
  transition(':leave', [
    animate(
      `${speedExit}ms ease-in`,
      style({ transform: 'translateY(-100%)' })
    ),
  ]),
]);
