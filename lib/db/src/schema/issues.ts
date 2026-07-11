import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { assetsTable } from "./assets";
import { usersTable } from "./users";

export const issuesTable = pgTable("issues", {
  id: serial("id").primaryKey(),
  issueNumber: text("issue_number").notNull().unique(),
  assetId: integer("asset_id")
    .notNull()
    .references(() => assetsTable.id, { onDelete: "cascade" }),
  reporterName: text("reporter_name").notNull(),
  reporterEmail: text("reporter_email").notNull(),
  reporterPhone: text("reporter_phone"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] })
    .notNull()
    .default("medium"),
  category: text("category").notNull(),
  imageUrls: text("image_urls").array().notNull().default([]),
  status: text("status", {
    enum: [
      "reported",
      "assigned",
      "inspection_started",
      "maintenance_in_progress",
      "waiting_for_parts",
      "resolved",
      "closed",
      "reopened",
    ],
  })
    .notNull()
    .default("reported"),
  assignedTechnicianId: integer("assigned_technician_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  aiTitle: text("ai_title"),
  aiCategory: text("ai_category"),
  aiPriority: text("ai_priority"),
  aiPossibleCauses: text("ai_possible_causes").array().notNull().default([]),
  aiDiagnosticChecks: text("ai_diagnostic_checks").array().notNull().default([]),
  aiSafetyNotes: text("ai_safety_notes"),
  aiRecurringWarning: text("ai_recurring_warning"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertIssueSchema = createInsertSchema(issuesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type Issue = typeof issuesTable.$inferSelect;
