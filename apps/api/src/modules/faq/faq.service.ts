import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const FAQ_SELECT = {
  id: true,
  question: true,
  answer: true,
  category: true,
  displayOrder: true,
  published: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic() {
    const items = await this.prisma.faqItem.findMany({
      where: { published: true },
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
      select: FAQ_SELECT,
    });
    // Group by category
    const grouped: Record<string, typeof items> = {};
    for (const item of items) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }
    return grouped;
  }

  async listAll() {
    return this.prisma.faqItem.findMany({
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
      select: FAQ_SELECT,
    });
  }

  async getPublic(id: string) {
    const item = await this.prisma.faqItem.findUnique({
      where: { id },
      select: FAQ_SELECT,
    });
    if (!item || !item.published) throw new NotFoundException('FAQ item not found');
    return item;
  }

  async create(data: { question: string; answer: string; category: string; displayOrder?: number }) {
    return this.prisma.faqItem.create({ data, select: FAQ_SELECT });
  }

  async update(id: string, data: { question?: string; answer?: string; category?: string; displayOrder?: number; published?: boolean }) {
    const item = await this.prisma.faqItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('FAQ item not found');
    return this.prisma.faqItem.update({ where: { id }, data, select: FAQ_SELECT });
  }

  async remove(id: string) {
    const item = await this.prisma.faqItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('FAQ item not found');
    await this.prisma.faqItem.delete({ where: { id } });
    return { success: true };
  }
}
