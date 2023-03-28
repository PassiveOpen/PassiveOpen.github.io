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
  selector: "checkbox-state",
  templateUrl: "./checkbox-state.component.html",
  styleUrls: ["./checkbox-state.component.scss"],
  animations: [stateSlideIn],
})
export class CheckboxStateComponent implements OnInit {
  @Input() floatLeft: boolean = false;
  @Input() state: boolean;
  @Output() stateChange = new EventEmitter();

  @HostBinding("class.hover") hover: boolean = false;

  constructor() {}

  ngOnInit(): void {}

  mouseleave() {
    this.hover = false;
  }
  mouseenter() {
    this.hover = true;
  }

  change() {
    this.stateChange.emit(!this.state);
  }
}
