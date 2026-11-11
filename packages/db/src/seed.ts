import { sql } from "drizzle-orm";
import { db, sqlClient } from "./client.js";
import { tenants, owners, properties, touches, campaigns, campaignMembers } from "./schema.js";

// Deterministic random numbers so every candidate gets the same data.
let seed = 42;
function rand(): number {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);

const TENANTS = [
  { id: "prescott", name: "The Prescott Team" },
  { id: "bayside", name: "Bayside Commercial" },
];

const OWNER_NAMES: Record<string, string[]> = {
  prescott: [
    "Smith Family Trust", "Lakeshore Holdings LLC", "Chen Revocable Trust", "Grand Ave Partners",
    "Okafor Properties LLC", "Nguyen Living Trust", "Telegraph 4 LLC", "Rivera Family Trust",
    "Piedmont Apartments LP", "Harrison Street Investors", "Patel Holdings", "Bellevue Realty LLC",
  ],
  bayside: [
    "Smith Holdings LLC", "Mission Bay Capital", "Kowalski Trust", "Sunset Ridge LP", "Ashby Partners",
  ],
};

const STREETS: Record<string, { city: string; zip: string; streets: string[] }> = {
  prescott: { city: "Oakland", zip: "94610", streets: ["Lakeshore Ave", "Grand Ave", "Bellevue Ave", "Mandana Blvd", "Telegraph Ave", "Harrison St", "Lenox Ave", "Perkins St"] },
  bayside: { city: "San Francisco", zip: "94110", streets: ["Valencia St", "Guerrero St", "Dolores St", "Folsom St"] },
};

const SUMMARIES: Record<string, string[]> = {
  call: ["Left voicemail", "Spoke with owner, not selling yet", "Owner asked for a valuation", "No answer"],
  email: ["Sent market update", "Sent BOV follow-up", "Replied about loan maturity"],
  mail: ["MVI letter mailed", "Just Sold postcard mailed", "Market report mailed"],
  meeting: ["Coffee with owner", "Property tour"],
  note: ["Owner may retire next year", "Heard about refinance"],
};

async function main() {
  await db.execute(sql`truncate campaign_members, campaigns, touches, properties, owners, tenants cascade`);
  await db.insert(tenants).values(TENANTS);

  for (const t of TENANTS) {
    const ownerRows = await db
      .insert(owners)
      .values(OWNER_NAMES[t.id].map((name, i) => ({ tenantId: t.id, name, mailingAddress: `${100 + i * 7} Main St, Suite ${i + 1}` })))
      .returning();

    const geo = STREETS[t.id];
    const count = t.id === "prescott" ? 40 : 15;
    const propRows = await db
      .insert(properties)
      .values(
        Array.from({ length: count }, (_, i) => ({
          tenantId: t.id,
          apn: t.id === "prescott" ? `010-0${700 + i}-0${10 + (i % 80)}-00` : `3${600 + i}-0${20 + i}`,
          address: `${200 + i * 13} ${pick(geo.streets)}`,
          city: geo.city,
          zip: geo.zip,
          units: 4 + Math.floor(rand() * 40),
          unitsVerified: i % 3 === 0,
          yearBuilt: 1910 + Math.floor(rand() * 70),
          tier: pick(["A", "B", "C", "D"]),
          ownerId: pick(ownerRows).id,
          lastSaleDate: daysAgo(365 * (3 + Math.floor(rand() * 25))).toISOString().slice(0, 10),
        })),
      )
      .returning();

    const touchValues = [];
    for (const p of propRows) {
      // About one in five properties has never been touched.
      if (rand() < 0.2) continue;
      const n = 1 + Math.floor(rand() * 8);
      for (let k = 0; k < n; k++) {
        const kind = pick(["call", "email", "mail", "meeting", "note"]);
        touchValues.push({
          tenantId: t.id,
          propertyId: p.id,
          kind,
          summary: pick(SUMMARIES[kind]),
          happenedAt: daysAgo(Math.floor(rand() * 220)),
        });
      }
    }
    if (touchValues.length) await db.insert(touches).values(touchValues);

    const campRows = await db
      .insert(campaigns)
      .values(["Spring MVI letters", "Loan maturity outreach", "Just Sold Grand Ave"].map((name) => ({ tenantId: t.id, name })))
      .returning();
    const memberValues = propRows
      .filter(() => rand() < 0.5)
      .map((p) => ({ tenantId: t.id, campaignId: pick(campRows).id, propertyId: p.id, addedAt: daysAgo(Math.floor(rand() * 150)) }));
    if (memberValues.length) await db.insert(campaignMembers).values(memberValues);
  }
  console.log("Seed complete.");
}

await main();
await sqlClient.end();
