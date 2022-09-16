import { Component, HostBinding, OnInit } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { AppService } from 'src/app/app.service';
import { TooltipService } from './tooltip.service';

@Component({
  selector: 'tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss'],
  host: { ['class']: 'popup' },
})
export class TooltipComponent implements OnInit {
  @HostBinding('class') class = 'base';
  html: SafeHtml = 'dummy';

  ngOnInit(): void {}
}
