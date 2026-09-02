export type ProfileSnapshot = {
  display_name: string;
  orientation: string;
  age: number;
  city: string;
  area: string;
  bio: string | null;
  whatsapp: string | null;
  telegram: string | null;
  price_short_time: number | null;
  price_overnight: number | null;
  price_weekend: number | null;
};

export const SNAPSHOT_FIELDS: (keyof ProfileSnapshot)[] = [
  "display_name",
  "orientation",
  "age",
  "city",
  "area",
  "bio",
  "whatsapp",
  "telegram",
  "price_short_time",
  "price_overnight",
  "price_weekend",
];

export const SNAPSHOT_FIELD_LABELS: Record<keyof ProfileSnapshot, string> = {
  display_name: "Display name",
  orientation: "Preference",
  age: "Age",
  city: "State",
  area: "Area",
  bio: "Bio",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  price_short_time: "Short-time price",
  price_overnight: "Overnight price",
  price_weekend: "Weekend price",
};

export function buildSnapshot(profile: Record<string, unknown>): ProfileSnapshot {
  const snapshot = {} as ProfileSnapshot;
  for (const field of SNAPSHOT_FIELDS) {
    (snapshot as Record<string, unknown>)[field] = profile[field] ?? null;
  }
  return snapshot;
}
