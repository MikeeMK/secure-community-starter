import { Body, Controller, Get, Param, Post, Request, UseGuards, Delete } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { StartChatDto, SendMessageDto } from './dto';

type AuthUser = { id: string; email: string; trustLevel: string };

@Controller('/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('/start')
  async startChat(@Body() body: unknown, @Request() req: ExpressRequest) {
    const dto = StartChatDto.parse(body);
    const user = req.user as AuthUser;
    return this.chat.findOrCreateConversation(user.id, dto.targetUserId, dto.announcementId);
  }

  @Get('/conversations')
  async listConversations(@Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    return this.chat.listConversations(user.id);
  }

  @Get('/unread')
  async countUnread(@Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    const count = await this.chat.countUnread(user.id);
    return { count };
  }

  @Get('/:id/messages')
  async getMessages(@Param('id') id: string, @Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    return this.chat.getMessages(id, user.id);
  }

  @Post('/:id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() body: unknown,
    @Request() req: ExpressRequest,
  ) {
    const dto = SendMessageDto.parse(body);
    const user = req.user as AuthUser;
    return this.chat.sendMessage(id, user.id, dto.content);
  }

  @Delete('/:id')
  async deleteConversation(@Param('id') id: string, @Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    return this.chat.deleteConversation(id, user.id);
  }
}
