import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(input: {
    reporterId: string;
    targetType: 'USER' | 'TOPIC' | 'POST' | 'MESSAGE';
    targetId: string;
    reason: string;
  }) {
    return this.prisma.report.create({
      data: {
        reporterId: input.reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        status: 'OPEN',
      },
      select: { id: true, status: true, createdAt: true },
    });
  }

  async listReports() {
    return this.prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        status: true,
        targetType: true,
        targetId: true,
        reason: true,
        createdAt: true,
        reporter: { select: { id: true, displayName: true } },
      },
    });
  }
}
