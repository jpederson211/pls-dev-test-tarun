import { pgTable, boolean, text, uuid, integer, date, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";

// Shared tables (no tenant_id) would go here. Everything below is tenant-owned.

export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const owners = pgTable(
  "owners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id),
    name: text("name").notNull(),
    mailingAddress: text("mailing_address"),
  },
  (t) => [index("owners_tenant_name_idx").on(t.tenantId, t.name)],
);

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id),
    apn: text("apn").notNull(),
    address: text("address").notNull(),
    city: text("city").notNull(),
    zip: text("zip").notNull(),
    units: integer("units"),
    yearBuilt: integer("year_built"),
    tier: text("tier"),
    ownerId: uuid("owner_id").references(() => owners.id),
    lastSaleDate: date("last_sale_date"),
    unitsVerified: boolean("units_verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("properties_tenant_apn_uq").on(t.tenantId, t.apn)],
);

export const touches = pgTable(
  "touches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id),
    propertyId: uuid("property_id").notNull().references(() => properties.id),
    kind: text("kind").notNull(),
    summary: text("summary").notNull(),
    happenedAt: timestamp("happened_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("touches_property_idx").on(t.tenantId, t.propertyId, t.happenedAt)],
);

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const campaignMembers = pgTable("campaign_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id),
  propertyId: uuid("property_id").notNull().references(() => properties.id),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull(),
});
