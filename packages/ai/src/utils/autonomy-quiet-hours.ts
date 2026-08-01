import type { QuietHours } from "@notra/ai/schemas/autonomy/mandate";

export const isWithinQuietHours = (
  now: Date,
  quietHours: QuietHours
): boolean => {
  const hour = now.getUTCHours();
  const { startHour, endHour } = quietHours;

  if (startHour === endHour) {
    return false;
  }

  if (startHour < endHour) {
    return hour >= startHour && hour < endHour;
  }

  return hour >= startHour || hour < endHour;
};
