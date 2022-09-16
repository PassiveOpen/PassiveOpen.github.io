import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
} from '@angular/core';
import { AppService } from 'src/app/app.service';
import { Tag } from '../enum.data';

@Component({
  selector: 'tag',
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.scss'],
})
export class TagComponent implements OnInit {
  @HostListener('mouseover')
  mouseover() {
    this.appService.setTag(this.tag);
  }
  @HostListener('mouseout')
  mouseout() {
    this.appService.setTag(undefined);
  }
  @Input() tag: Tag;

  constructor(private appService: AppService, private elementRef: ElementRef) {}

  ngOnInit(): void {}
}
