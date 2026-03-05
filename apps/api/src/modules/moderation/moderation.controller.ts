import { Body, Controller, Get, Post } from '@nestjs/common';
import { z } from 'zod';
import { ModerationService } from './moderation.service';

const CreateReportDto = z.object({
  reporterId: z.string().min(1),
  targetType: z.enum(['USER', 'TOPIC', 'POST', 'MESSAGE']),
  targetId: z.string().min(1),
  reason: z.string().min(3).max(500),
});

@Controller('/moderation')
export class ModerationController {
  constructor(private readonly mod: ModerationService) {}

  @Post('/reports')
  async createReport(@Body() body: unknown) {
    const dto = CreateReportDto.parse(body);
    return this.mod.createReport(dto);
  }

  @Get('/reports')
  async listReports() {
    return this.mod.listReports();
  }
}
