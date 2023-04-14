import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import { foldSlideIn } from "../animations";

@Component({
  selector: "button-option",
  templateUrl: "./button-option.component.html",
  styleUrls: ["./button-option.component.scss"],
  animations: [foldSlideIn],
})
export class ButtonOptionComponent implements OnInit {
  @Input() floatLeft: boolean = false;
  @Output() click = new EventEmitter();
  @HostBinding("class.hover") hover: boolean = true;
  @HostBinding("class.hover") @Input() disabled: boolean = false;
  timedOutCloser: ReturnType<typeof setTimeout>;

  constructor() {}

  ngOnInit(): void {}

  mouseEnter(trigger) {
    if (this.timedOutCloser) {
      clearTimeout(this.timedOutCloser);
    }
    trigger.openMenu();
  }

  mouseLeave(trigger) {
    this.timedOutCloser = setTimeout(() => {
      trigger.closeMenu();
    }, 50);
  }
}
