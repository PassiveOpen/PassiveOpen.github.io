import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import { stateSlideIn } from "../animations";

@Component({
  selector: "button-state",
  templateUrl: "./button-state.component.html",
  styleUrls: ["./button-state.component.scss"],
  animations: [stateSlideIn],
})
export class ButtonStateComponent implements OnInit {
  @Input() floatLeft: boolean = false;
  @Output() click = new EventEmitter();
  @HostBinding("class.hover") hover: boolean = false;
  @HostBinding("class.hover") @Input() disabled: boolean = false;

  constructor() {}

  ngOnInit(): void {}

  mouseleave() {
    this.hover = false;
  }
  mouseenter() {
    this.hover = true;
  }
}
