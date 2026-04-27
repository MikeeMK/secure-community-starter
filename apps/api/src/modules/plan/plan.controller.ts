import { Controller, Get, Post, Param, Request, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlanService, PLAN_LIMITS, PLAN_FEATURES } from './plan.service';

type AuthUser = { id: string; email: string; trustLevel: string };

@Controller('/plan')
@UseGuards(JwtAuthGuard)
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  async getMyPlan(@Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    const { plan, planExpiresAt, limits } = await this.planService.getUserPlan(user.id);
    const { used, max } = await this.planService.getMyAnnouncementsCount(user.id);
    return {
      plan,
      planExpiresAt,
      limits,
      features: PLAN_FEATURES[plan],
      announcementsUsed: used,
      announcementsMax: max,
    };
  }

  @Get('/catalog')
  getCatalog() {
    return {
      plans: [
        {
          id: 'free',
          name: 'Free',
          price: 0,
          currency: 'EUR',
          limits: PLAN_LIMITS.free,
          features: PLAN_FEATURES.free,
        },
        {
          id: 'plus',
          name: 'Plus',
          price: 4.99,
          currency: 'EUR',
          limits: PLAN_LIMITS.plus,
          features: PLAN_FEATURES.plus,
        },
        {
          id: 'premium',
          name: 'Premium',
          price: 9.99,
          currency: 'EUR',
          limits: PLAN_LIMITS.premium,
          features: PLAN_FEATURES.premium,
        },
      ],
    };
  }

  @Post('/boost/:topicId')
  async boostTopic(@Param('topicId') topicId: string, @Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    await this.planService.boostTopic(topicId, user.id);
    return { success: true, message: 'Annonce boostée pour 7 jours.' };
  }

  @Post('/feature/:topicId')
  async featureTopic(@Param('topicId') topicId: string, @Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    await this.planService.featureTopic(topicId, user.id);
    return { success: true, message: 'Annonce mise en avant pour 7 jours.' };
  }
}
