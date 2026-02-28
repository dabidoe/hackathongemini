"use client"

export const THEME_OPTIONS = ["Fantasy", "Cyberpunk"] as const
export const CLASS_OPTIONS = ["Warrior", "Mage", "Rogue", "Healer"] as const
export const EYE_OPTIONS = ["Blue", "Green", "Brown", "Amber", "Silver"] as const
export const HAIR_OPTIONS = ["Black", "Brown", "Blonde", "Silver", "Red"] as const
export const HAT_OPTIONS = ["None", "Hood", "Helmet", "Crown", "Cap"] as const

export type ThemeOption = (typeof THEME_OPTIONS)[number]
export type ClassOption = (typeof CLASS_OPTIONS)[number]
export type EyeOption = (typeof EYE_OPTIONS)[number]
export type HairOption = (typeof HAIR_OPTIONS)[number]
export type HatOption = (typeof HAT_OPTIONS)[number]

export interface SelectedChips {
  theme?: ThemeOption
  class?: ClassOption
  eyeColor?: EyeOption
  hairColor?: HairOption
  hat?: HatOption
}

interface ChipGroupProps<T extends string> {
  label: string
  options: readonly T[]
  value: T | undefined
  onChange: (v: T | undefined) => void
}

function ChipGroup<T extends string>({ label, options, value, onChange }: ChipGroupProps<T>) {
  return (
    <div className="space-y-1.5">
      <span className="text-[9px] font-mono uppercase tracking-wider text-foreground font-medium">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(value === opt ? undefined : (opt as T))}
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono transition-all border ${
              value === opt
                ? "bg-primary/30 border-primary text-primary font-semibold"
                : "bg-background/50 border-primary/40 text-foreground hover:border-primary/60 hover:bg-primary/10"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

interface ProfileChipsProps {
  chips: SelectedChips
  onChange: (chips: SelectedChips) => void
}

export function ProfileChips({ chips, onChange }: ProfileChipsProps) {
  return (
    <div className="space-y-3">
      <ChipGroup
        label="Theme"
        options={THEME_OPTIONS}
        value={chips.theme}
        onChange={(v) => onChange({ ...chips, theme: v })}
      />
      <ChipGroup
        label="Class"
        options={CLASS_OPTIONS}
        value={chips.class}
        onChange={(v) => onChange({ ...chips, class: v })}
      />
      <ChipGroup
        label="Eye color"
        options={EYE_OPTIONS}
        value={chips.eyeColor}
        onChange={(v) => onChange({ ...chips, eyeColor: v })}
      />
      <ChipGroup
        label="Hair color"
        options={HAIR_OPTIONS}
        value={chips.hairColor}
        onChange={(v) => onChange({ ...chips, hairColor: v })}
      />
      <ChipGroup
        label="Hat / Accessory"
        options={HAT_OPTIONS}
        value={chips.hat}
        onChange={(v) => onChange({ ...chips, hat: v })}
      />
    </div>
  )
}
