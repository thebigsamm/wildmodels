export const NG_TOP_STATES = [
  "Abuja", // NEW

  "Kano",
  "Lagos",
  "Katsina",
  "Kaduna",
  "Oyo",
  "Anambra",
  "Rivers",
  "Niger",
  "Benue",
  "Ogun",
  "Sokoto",
  "Delta",
  "Imo",
  "Ondo",
  "Akwa Ibom",
  "Edo",

  "Enugu", // NEW

  "Bayelsa",
  "Cross River",
  "Kogi",
  "Abia",
] as const;

export type NgTopState = (typeof NG_TOP_STATES)[number];

export function isAllowedNgState(city: string) {
  const t = city.trim().toLowerCase();
  return NG_TOP_STATES.some((s) => s.toLowerCase() === t);
}