import { Controller, Get } from '@nestjs/common';
import { SidebarService } from './sidebar.service';

@Controller('/community')
export class SidebarController {
  constructor(private readonly sidebar: SidebarService) {}

  @Get('/sidebar')
  getSidebar() {
    return this.sidebar.getSidebar();
  }
}
