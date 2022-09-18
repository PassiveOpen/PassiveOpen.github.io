import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  Renderer2,
} from '@angular/core';
import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
  year = new Date().getFullYear();
  title = this.appService.title;

  constructor(private appService: AppService) {}

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {}
}
