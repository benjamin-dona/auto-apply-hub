import { z } from 'zod';

export const OfferSchema = z.object({
  id: z.string(),
  source_site: z.string(),
  source_offer_id: z.string(),
  title: z.string(),
  description: z.string(),
  skills: z.array(z.string()).default([]),
  budget_min: z.number().nullable(),
  budget_max: z.number().nullable(),
  currency: z.string().nullable(),
  published_at: z.date(),
  expires_at: z.date().nullable(),
  status: z.enum(['open', 'closed', 'archived']),
  raw_payload: z.record(z.unknown()),
  created_at: z.date(),
  updated_at: z.date(),
});

export type Offer = z.infer<typeof OfferSchema>;

export interface RawWorkanaOffer {
  id: string | number;
  title: string;
  description: string;
  budget?: { min?: number; max?: number; currency?: string };
  skills?: string[];
  published_at?: string;
  expires_at?: string;
  url?: string;
  [key: string]: unknown;
}
