import { pgTable, serial, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  conversationId: uuid('conversation_id').notNull(),
  role: text('role', { enum: ['system', 'user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Types for TypeScript
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert; 