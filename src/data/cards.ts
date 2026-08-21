import rawDeck from '../../content/phase2-cards.json';

export type SourceTier = 'EPSO_GUIDANCE' | 'OFFICIAL_EU_BACKGROUND';
export type Volatility = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Phase2CardSource {
  source_title: string;
  url: string;
  locator: string;
  version_or_snapshot_date: string;
  source_tier: SourceTier;
  verified_at: string;
  volatility: Volatility;
}

export interface Phase2Card {
  id: string;
  topic: string;
  front: string;
  back: string;
  detail: string;
  tags: string[];
  source: Phase2CardSource;
}

export interface Phase2Deck {
  title: string;
  phase: number;
  status: string;
  disclaimer: string;
  verified_at: string;
  cards: Phase2Card[];
}

export const phase2Deck = rawDeck as Phase2Deck;
export const phase2Cards = phase2Deck.cards;
