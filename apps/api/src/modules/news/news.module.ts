import { Module } from '@nestjs/common';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { FeedbackModule } from '../feedback/feedback.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, FeedbackModule],
  controllers: [NewsController],
  providers: [NewsService],
})
export class NewsModule {}
