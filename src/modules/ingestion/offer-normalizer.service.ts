import { randomUUID } from 'node:crypto';
import type { RawWorkanaOffer } from '../../api/schemas/offer.schema.js';
import type { Offer } from '../../api/schemas/offer.schema.js';

export class OfferNormalizerService {
  normalizeWorkana(raw: RawWorkanaOffer): Offer {
    const sourceOfferId = String(raw.id);
    const now = new Date();

    return {
      id: `workana:${sourceOfferId}`,
      source_site: 'workana',
      source_offer_id: sourceOfferId,
      title: String(raw.title ?? '').trim(),
      description: String(raw.description ?? '').trim(),
      skills: Array.isArray(raw.skills) ? raw.skills.map(String) : [],
      budget_min: raw.budget?.min ?? null,
      budget_max: raw.budget?.max ?? null,
      currency: raw.budget?.currency ?? null,
      published_at: raw.published_at ? new Date(raw.published_at) : now,
      expires_at: raw.expires_at ? new Date(raw.expires_at) : null,
      status: 'open',
      raw_payload: raw as Record<string, unknown>,
      created_at: now,
      updated_at: now,
    };
  }
}

// Suppress unused import warning
void randomUUID;
