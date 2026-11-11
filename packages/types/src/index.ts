import { z } from "zod";

// The API contract. Web and API import these same schemas.

export const Tier = z.enum(["A", "B", "C", "D"]);
export type Tier = z.infer<typeof Tier>;

export const PropertySearchQuery = z.object({
  apn: z.string().trim().optional(),
  address: z.string().trim().optional(),
  owner: z.string().trim().optional(),
  tier: Tier.optional(),
  sort: z.enum(["tier", "last_touch"]).optional(),
  dir: z.enum(["asc", "desc"]).optional(),
});
export type PropertySearchQuery = z.infer<typeof PropertySearchQuery>;

export const PropertyRow = z.object({
  id: z.string(),
  apn: z.string(),
  address: z.string(),
  city: z.string(),
  zip: z.string(),
  units: z.number().nullable(),
  unitsVerified: z.boolean(),
  tier: Tier.nullable(),
  ownerName: z.string().nullable(),
  lastTouchAt: z.string().nullable(),
});
export type PropertyRow = z.infer<typeof PropertyRow>;

export const Touch = z.object({
  id: z.string(),
  kind: z.enum(["call", "email", "mail", "meeting", "note"]),
  summary: z.string(),
  happenedAt: z.string(),
});
export type Touch = z.infer<typeof Touch>;

export const CampaignHistoryItem = z.object({
  campaignId: z.string(),
  name: z.string(),
  addedAt: z.string(),
});
export type CampaignHistoryItem = z.infer<typeof CampaignHistoryItem>;

export const PropertyPreview = z.object({
  property: PropertyRow,
  touches: z.array(Touch),
  campaigns: z.array(CampaignHistoryItem),
});
export type PropertyPreview = z.infer<typeof PropertyPreview>;

export const TenantSummary = z.object({ id: z.string(), name: z.string() });
export type TenantSummary = z.infer<typeof TenantSummary>;
