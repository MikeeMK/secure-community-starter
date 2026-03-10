import { Body, Controller, Delete, Get, Param, Post, Patch, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { FaqService } from './faq.service';

const CreateFaqDto = z.object({
  question: z.string().min(5).max(300),
  answer: z.string().min(10).max(5000),
  category: z.string().min(2).max(50),
  displayOrder: z.number().int().optional(),
});

const UpdateFaqDto = z.object({
  question: z.string().min(5).max(300).optional(),
  answer: z.string().min(10).max(5000).optional(),
  category: z.string().min(2).max(50).optional(),
  displayOrder: z.number().int().optional(),
  published: z.boolean().optional(),
});

@Controller('/faq')
export class FaqController {
  constructor(private readonly faq: FaqService) {}

  /** Public — no auth required */
  @Get()
  async listPublic() {
    return this.faq.listPublic();
  }

  /** Admin only */
  @Get('/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async listAll() {
    return this.faq.listAll();
  }

  @Get('/:id')
  async getOne(@Param('id') id: string) {
    return this.faq.getPublic(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() body: unknown) {
    const dto = CreateFaqDto.parse(body);
    return this.faq.create(dto);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateFaqDto.parse(body);
    return this.faq.update(id, dto);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async remove(@Param('id') id: string) {
    return this.faq.remove(id);
  }
}
