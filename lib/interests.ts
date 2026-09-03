export const INTEREST_GROUPS: { label: string; options: string[] }[] = [
  {
    label: "Going out",
    options: ["Nightlife", "Clubbing", "Live music", "Karaoke", "Bar hopping", "Comedy shows", "Concerts"],
  },
  {
    label: "Chill & home",
    options: ["Netflix & chill", "Board games", "Cooking together", "Wine tasting", "Video games", "Anime"],
  },
  {
    label: "Active & outdoors",
    options: ["Gym", "Yoga", "Running", "Swimming", "Football", "Basketball", "Hiking", "Dancing"],
  },
  {
    label: "Culture & mind",
    options: ["Movies", "Reading", "Deep talks", "Photography", "Fashion", "Art", "Poetry", "Podcasts"],
  },
  {
    label: "Food & drink",
    options: ["Foodie", "Cooking", "Wine", "Cocktails", "Suya", "Street food", "Brunch"],
  },
  {
    label: "Travel & lifestyle",
    options: ["Travel", "Road trips", "Beach days", "Spontaneous plans", "Weekend getaways"],
  },
  {
    label: "Vibe",
    options: ["Spontaneous", "Homebody", "Adventurous", "Late nights", "Early riser", "Flirty", "Easygoing"],
  },
];

export const ALL_INTERESTS = INTEREST_GROUPS.flatMap((g) => g.options);

export const MAX_INTERESTS = 10;

export function isValidInterestList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_INTERESTS &&
    value.every((v) => typeof v === "string" && ALL_INTERESTS.includes(v)) &&
    new Set(value).size === value.length
  );
}
