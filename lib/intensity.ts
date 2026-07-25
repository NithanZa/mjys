// Shared class-intensity levels. Stored/imported/exported as single-letter codes.
export const INTENSITIES = ["A", "B", "I"] as const;
export type Intensity = (typeof INTENSITIES)[number];

export const INTENSITY_LABELS: Record<Intensity, string> = {
    A: "All Level",
    B: "Basic",
    I: "Intermediate",
};

export function isIntensity(value: string): value is Intensity {
    return (INTENSITIES as readonly string[]).includes(value);
}

export function intensityLabel(value: string): string {
    return isIntensity(value) ? INTENSITY_LABELS[value] : value;
}
