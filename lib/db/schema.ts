import {
  pgTable,
  uuid,
  text,
  numeric,
  date,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import type { Violation } from "@/types";

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: text("account_id").unique().notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  plan: text("plan").notNull(),
  amountDue: numeric("amount_due", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status", { enum: ["pending", "contacted", "resolved"] })
    .notNull()
    .default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const outreachLog = pgTable("outreach_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => customers.id, {
    onDelete: "cascade",
  }),
  type: text("type", { enum: ["email", "sms", "call_script"] }).notNull(),
  mode: text("mode", { enum: ["guarded", "unguarded"] }).notNull(),
  generatedText: text("generated_text").notNull(),
  verified: boolean("verified").default(false),
  violations: jsonb("violations").$type<Violation[]>(),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type OutreachLog = typeof outreachLog.$inferSelect;
export type NewOutreachLog = typeof outreachLog.$inferInsert;
