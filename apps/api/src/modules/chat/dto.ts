import { z } from 'zod';

export const StartChatDto = z.object({
  targetUserId: z.string(),
  announcementId: z.string().optional(),
});

export const SendMessageDto = z.object({
  content: z.string().min(1).max(5000),
});
