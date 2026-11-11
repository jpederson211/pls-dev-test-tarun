import { sql } from "drizzle-orm";
import { db } from "@pls/db";
import type { PropertyRow } from "@pls/types";

/**
 * Fast path for owner-name search. Uses a hand-written query so Postgres can
 * use the owners name index directly. Owner names are the most common search
 * from the ISA team, so this path matters for speed.
 */
export async function searchByOwnerName(name: string): Promise<PropertyRow[]> {
  const rows = await db.execute(sql`
    select p.id, p.apn, p.address, p.city, p.zip, p.units, p.units_verified as "unitsVerified", p.tier,
           o.name as "ownerName",
           (select max(t.happened_at) from touches t where t.property_id = p.id) as "lastTouchAt"
    from properties p
    join owners o on o.id = p.owner_id
    where o.name ilike ${"%" + name + "%"}
    order by p.apn
    limit 200
  `);
  return rows.map((r: any) => ({
    id: String(r.id),
    apn: String(r.apn),
    address: String(r.address),
    city: String(r.city),
    zip: String(r.zip),
    units: r.units === null ? null : Number(r.units),
    unitsVerified: Boolean(r.unitsVerified),
    tier: (r.tier as PropertyRow["tier"]) ?? null,
    ownerName: (r.ownerName as string | null) ?? null,
    lastTouchAt: r.lastTouchAt ? new Date(r.lastTouchAt as string).toISOString() : null,
  }));
}
