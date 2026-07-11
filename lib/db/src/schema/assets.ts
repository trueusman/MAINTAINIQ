import { pgTable, text, serial, timestamp, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const assetsTable = pgTable("assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  assetCode: text("asset_code").notNull().unique(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  model: text("model"),
  manufacturer: text("manufacturer"),
  purchaseDate: date("purchase_date", { mode: "string" }),
  warrantyExpiry: date("warranty_expiry", { mode: "string" }),
  condition: text("condition", {
    enum: ["excellent", "good", "fair", "poor"],
  })
    .notNull()
    .default("good"),
  status: text("status", {
    enum: ["operational", "under_maintenance", "out_of_service", "retired"],
  })
    .notNull()
    .default("operational"),
  assignedTechnicianId: integer("assigned_technician_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  lastServiceDate: date("last_service_date", { mode: "string" }),
  nextServiceDate: date("next_service_date", { mode: "string" }),
  internalNotes: text("internal_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertAssetSchema = createInsertSchema(assetsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assetsTable.$inferSelect;
