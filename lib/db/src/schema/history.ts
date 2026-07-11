import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { assetsTable } from "./assets";
import { issuesTable } from "./issues";
import { usersTable } from "./users";

export const historyTable = pgTable("history", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id")
    .notNull()
    .references(() => assetsTable.id, { onDelete: "cascade" }),
  issueId: integer("issue_id").references(() => issuesTable.id, { onDelete: "set null" }),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  userName: text("user_name").notNull(),
  action: text("action").notNull(),
  status: text("status"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHistorySchema = createInsertSchema(historyTable).omit({
  id: true,
  createdAt: true,
});
export type InsertHistory = z.infer<typeof insertHistorySchema>;
export type HistoryEntry = typeof historyTable.$inferSelect;
