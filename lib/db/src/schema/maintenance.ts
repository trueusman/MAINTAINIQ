import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { issuesTable } from "./issues";
import { usersTable } from "./users";

export const maintenanceTable = pgTable("maintenance", {
  id: serial("id").primaryKey(),
  issueId: integer("issue_id")
    .notNull()
    .references(() => issuesTable.id, { onDelete: "cascade" }),
  technicianId: integer("technician_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  notes: text("notes").notNull().default(""),
  cost: numeric("cost", { mode: "number" }),
  replacementParts: text("replacement_parts").array().notNull().default([]),
  timeSpentMinutes: integer("time_spent_minutes"),
  images: text("images").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMaintenanceSchema = createInsertSchema(maintenanceTable).omit({
  id: true,
  createdAt: true,
});
export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;
export type Maintenance = typeof maintenanceTable.$inferSelect;
