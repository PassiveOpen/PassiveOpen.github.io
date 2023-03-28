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
  selector: "checkbox-toc",
  templateUrl: "./checkbox-toc.component.html",
  styleUrls: ["./checkbox-toc.component.scss"],
  animations: [stateSlideIn],
})
export class CheckboxTocComponent implements OnInit {
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
