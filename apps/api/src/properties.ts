import type { FastifyInstance } from "fastify";
import { asc, desc, eq, ilike, sql } from "drizzle-orm";
import { db, owners, properties, touches, campaigns, campaignMembers, tenantWhere } from "@pls/db";
import { PropertySearchQuery, type PropertyPreview, type PropertyRow } from "@pls/types";
import { searchByOwnerName } from "./ownerSearch.js";

const lastTouch = sql<Date | null>`(select max(${touches.happenedAt}) from ${touches} where ${touches.propertyId} = ${properties.id})`;

function toRow(r: {
  id: string; apn: string; address: string; city: string; zip: string; units: number | null;
  unitsVerified: boolean;
  tier: string | null; ownerName: string | null; lastTouchAt: Date | string | null;
}): PropertyRow {
  return {
    ...r,
    tier: (r.tier as PropertyRow["tier"]) ?? null,
    lastTouchAt: r.lastTouchAt ? new Date(r.lastTouchAt).toISOString() : null,
  };
}

export function registerPropertyRoutes(app: FastifyInstance) {
  app.get("/properties", async (req, reply) => {
    const parsed = PropertySearchQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const q = parsed.data;

    if (q.owner) return searchByOwnerName(q.owner);

    const direction = q.dir === "desc" ? desc : asc;
    const orderBy =
      q.sort === "tier" ? [direction(properties.tier), asc(properties.apn)]
      : q.sort === "last_touch" ? [direction(lastTouch), asc(properties.apn)]
      : [asc(properties.apn)];

    const rows = await db
      .select({
        id: properties.id,
        apn: properties.apn,
        address: properties.address,
        city: properties.city,
        zip: properties.zip,
        units: properties.units,
        unitsVerified: properties.unitsVerified,
        tier: properties.tier,
        ownerName: owners.name,
        lastTouchAt: lastTouch,
      })
      .from(properties)
      .leftJoin(owners, eq(owners.id, properties.ownerId))
      .where(
        tenantWhere(
          properties,
          req.tenantId,
          q.apn ? ilike(properties.apn, `${q.apn}%`) : undefined,
          q.address ? ilike(properties.address, `%${q.address}%`) : undefined,
          q.tier ? eq(properties.tier, q.tier) : undefined,
        ),
      )
      .orderBy(...orderBy)
      .limit(200);

    return rows.map(toRow);
  });

  app.get<{ Params: { id: string } }>("/properties/:id/preview", async (req, reply) => {
    const [p] = await db
      .select({
        id: properties.id,
        apn: properties.apn,
        address: properties.address,
        city: properties.city,
        zip: properties.zip,
        units: properties.units,
        unitsVerified: properties.unitsVerified,
        tier: properties.tier,
        ownerName: owners.name,
        lastTouchAt: lastTouch,
      })
      .from(properties)
      .leftJoin(owners, eq(owners.id, properties.ownerId))
      .where(tenantWhere(properties, req.tenantId, eq(properties.id, req.params.id)));
    if (!p) return reply.code(404).send({ error: "Not found" });

    // Touches in the last 90 days, newest first.
    const recent = await db
      .select()
      .from(touches)
      .where(tenantWhere(touches, req.tenantId, eq(touches.propertyId, p.id)))
      .orderBy(desc(touches.happenedAt))
      .limit(90);

    const history = await db
      .select({ campaignId: campaigns.id, name: campaigns.name, addedAt: campaignMembers.addedAt })
      .from(campaignMembers)
      .innerJoin(campaigns, eq(campaigns.id, campaignMembers.campaignId))
      .where(tenantWhere(campaignMembers, req.tenantId, eq(campaignMembers.propertyId, p.id)))
      .orderBy(desc(campaignMembers.addedAt));

    const result: PropertyPreview = {
      property: toRow(p),
      touches: recent.map((t) => ({
        id: t.id,
        kind: t.kind as PropertyPreview["touches"][number]["kind"],
        summary: t.summary,
        happenedAt: t.happenedAt.toISOString(),
      })),
      campaigns: history.map((h) => ({ ...h, addedAt: h.addedAt.toISOString() })),
    };
    return result;
  });
}
