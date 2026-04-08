import { db } from "./index";
import { customers, outreachLog, type NewOutreachLog } from "./schema";
import { eq, desc, asc } from "drizzle-orm";

export const getAllCustomers = () =>
  db.select().from(customers).orderBy(asc(customers.dueDate));

export const getCustomerById = (id: string) =>
  db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .then((rows) => rows[0] ?? null);

export const getLogsByCustomerId = (customerId: string) =>
  db
    .select()
    .from(outreachLog)
    .where(eq(outreachLog.customerId, customerId))
    .orderBy(desc(outreachLog.createdAt));

export const getRecentLogs = (limit = 5) =>
  db
    .select({
      id: outreachLog.id,
      customerId: outreachLog.customerId,
      type: outreachLog.type,
      mode: outreachLog.mode,
      generatedText: outreachLog.generatedText,
      verified: outreachLog.verified,
      violations: outreachLog.violations,
      createdAt: outreachLog.createdAt,
      customerName: customers.fullName,
    })
    .from(outreachLog)
    .leftJoin(customers, eq(outreachLog.customerId, customers.id))
    .orderBy(desc(outreachLog.createdAt))
    .limit(limit);

export const insertOutreachLog = (data: NewOutreachLog) =>
  db
    .insert(outreachLog)
    .values(data)
    .returning()
    .then((rows) => rows[0]);

export type RecentLog = Awaited<ReturnType<typeof getRecentLogs>>[number];
