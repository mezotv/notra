import { useStore } from "@tanstack/react-form";
import { BrandIdentityRadioGroup } from "@/components/brand-identity-radio-group";
import { FORMAT_CARD_META } from "@/constants/content-formats";
import { supportsAutoPublish } from "@/constants/schedule-output-types";
import type { EventTriggerRulesSectionProps } from "@/types/automation/event-trigger";
import { TriggerSwitchRow } from "./trigger-switch-row";

export function EventTriggerRulesSection({
  form,
  brandVoices,
}: EventTriggerRulesSectionProps) {
  const outputType = useStore(form.store, (s) => s.values.outputType);

  const nonDefaultBrandVoices = brandVoices.filter((voice) => !voice.isDefault);
  const defaultBrandVoiceName = brandVoices.find(
    (voice) => voice.isDefault
  )?.name;
  const defaultBrandVoiceLabel = defaultBrandVoiceName
    ? `${defaultBrandVoiceName} (Default)`
    : "Default brand voice";

  if (!(brandVoices.length > 1 || supportsAutoPublish(outputType))) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="font-semibold text-base">
          {FORMAT_CARD_META[outputType].label} rules
        </h3>
        <p className="text-muted-foreground text-sm">
          Voice and publishing behaviour for this trigger.
        </p>
      </div>

      {brandVoices.length > 1 && (
        <form.Field name="brandVoiceId">
          {(field) => (
            <BrandIdentityRadioGroup
              description="Choose which brand voice to use for generated content."
              emptyOption={{
                label: defaultBrandVoiceLabel,
                description: "Use your default brand voice.",
              }}
              id={field.name}
              label="Brand voice"
              onChange={field.handleChange}
              value={field.state.value}
              voices={nonDefaultBrandVoices}
            />
          )}
        </form.Field>
      )}

      {supportsAutoPublish(outputType) && (
        <form.Field name="autoPublish">
          {(field) => (
            <TriggerSwitchRow
              checked={field.state.value}
              id={field.name}
              label="Auto-publish"
              onCheckedChange={field.handleChange}
              tooltip="When on, posts are published immediately instead of saved as drafts."
            />
          )}
        </form.Field>
      )}
    </section>
  );
}
