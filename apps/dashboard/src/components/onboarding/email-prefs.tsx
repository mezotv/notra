"use client";

import { Checkbox } from "@/components/motion/checkbox";
import { ONBOARDING_EMAIL_PREFS } from "@/constants/onboarding";
import type { OnboardingEmailPrefsProps } from "@/types/onboarding";

export function OnboardingEmailPrefs({
  dailySummary,
  marketingEmails,
  disabled,
  onDailySummaryChange,
  onMarketingEmailsChange,
}: OnboardingEmailPrefsProps) {
  const values = { dailySummary, marketingEmails };
  const onChange = {
    dailySummary: onDailySummaryChange,
    marketingEmails: onMarketingEmailsChange,
  };

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Emails</legend>
      {ONBOARDING_EMAIL_PREFS.map((pref) => (
        <div className="space-y-1" key={pref.key}>
          <Checkbox
            checked={values[pref.key]}
            disabled={disabled}
            id={`onboarding-${pref.key}`}
            label={pref.label}
            onCheckedChange={onChange[pref.key]}
          />
          <p className="text-muted-foreground pl-8 text-xs">
            {pref.description}
          </p>
        </div>
      ))}
    </fieldset>
  );
}
