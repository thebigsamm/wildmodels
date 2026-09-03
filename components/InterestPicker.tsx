"use client";

import { INTEREST_GROUPS, MAX_INTERESTS } from "@/lib/interests";

export function InterestPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(interest: string) {
    if (selected.includes(interest)) {
      onChange(selected.filter((i) => i !== interest));
    } else if (selected.length < MAX_INTERESTS) {
      onChange([...selected, interest]);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="text-xs text-[#8f6b78]">
        {selected.length}/{MAX_INTERESTS} selected
      </div>

      {INTEREST_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[#8f6b78]">
            {group.label}
          </div>
          <div className="flex flex-wrap gap-2">
            {group.options.map((interest) => {
              const active = selected.includes(interest);
              const disabled = !active && selected.length >= MAX_INTERESTS;
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggle(interest)}
                  disabled={disabled}
                  className={
                    active
                      ? "rounded-full border border-[#ff115a] bg-gradient-to-r from-[#ff115a] to-[#c400ff] px-3 py-1.5 text-sm font-bold text-[#060002]"
                      : "rounded-full border border-white/20 bg-[#220413] px-3 py-1.5 text-sm text-[#fbecef] hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                  }
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
