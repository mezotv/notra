import type { ToneProfile } from "@notra/ai/schemas/tone";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@notra/ui/components/ui/combobox";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useForm } from "@tanstack/react-form";
import { useAsyncDebouncer } from "@tanstack/react-pacer";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useUpdateBrandSettings } from "../../../../../../lib/hooks/use-brand-analysis";
import {
  AUTO_SAVE_DELAY,
  getLanguageFlag,
  LANGUAGE_OPTIONS,
  TONE_OPTIONS,
} from "../constants/brand-identity";
import type { BrandFormProps } from "../types/brand-identity";

export function BrandForm({
  organizationId,
  voiceId,
  initialData,
  onSavingChange,
  onSavedAtChange,
}: BrandFormProps) {
  const updateMutation = useUpdateBrandSettings(organizationId);
  const lastSavedData = useRef<string>(JSON.stringify(initialData));

  const debouncer = useAsyncDebouncer(
    async (values: typeof initialData) => {
      const { useCustomTone: _, websiteUrl: rawUrl, ...valuesToSave } = values;
      const trimmedUrl = rawUrl.trim();
      const websiteUrl =
        trimmedUrl && !trimmedUrl.startsWith("https://")
          ? `https://${trimmedUrl}`
          : trimmedUrl || undefined;
      await updateMutation.mutateAsync({
        ...valuesToSave,
        id: voiceId,
        ...(websiteUrl !== undefined && { websiteUrl }),
      });
      lastSavedData.current = JSON.stringify(values);
      onSavedAtChange?.(new Date());
      onSavingChange?.(false);
    },
    {
      wait: AUTO_SAVE_DELAY,
      onError: (error) => {
        onSavingChange?.(false);
        toast.error(
          error instanceof Error ? error.message : "Failed to save changes"
        );
      },
    }
  );

  const form = useForm({
    defaultValues: initialData,
    onSubmit: async () => undefined,
    listeners: {
      onChange: ({ formApi }) => {
        const currentValues = formApi.state.values;
        const currentData = JSON.stringify(currentValues);

        if (currentData === lastSavedData.current) {
          debouncer.cancel();
          onSavingChange?.(false);
          return;
        }

        if (currentValues.useCustomTone && !currentValues.customTone.trim()) {
          debouncer.cancel();
          onSavingChange?.(false);
          return;
        }

        onSavingChange?.(true);
        debouncer.maybeExecute(currentValues);
      },
    },
  });

  useEffect(() => {
    return () => {
      onSavingChange?.(false);
    };
  }, [onSavingChange]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TitleCard heading="Company Profile">
        <div className="space-y-6">
          <form.Field name="companyName">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Company name</Label>
                <Input
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Your company name"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="websiteUrl">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Website</Label>
                <div className="flex w-full flex-row items-center rounded-md border border-border transition-colors focus-within:border-ring focus-within:ring-ring/50">
                  <label
                    className="border-border border-r px-2.5 py-1.5 text-muted-foreground text-sm transition-colors"
                    htmlFor={field.name}
                  >
                    https://
                  </label>
                  <input
                    className="flex-1 bg-transparent px-2.5 py-1.5 text-sm outline-none"
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="example.com"
                    type="text"
                    value={field.state.value}
                  />
                </div>
              </div>
            )}
          </form.Field>

          <form.Field name="companyDescription">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Description</Label>
                <Textarea
                  className="min-h-30"
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="A short overview of your company"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>
        </div>
      </TitleCard>

      <TitleCard heading="Tone & Language">
        <form.Field name="useCustomTone">
          {(useCustomToneField) => (
            <fieldset className="space-y-4">
              <legend className="sr-only">Tone selection</legend>
              <form.Field name="toneProfile">
                {(toneProfileField) => (
                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        checked={!useCustomToneField.state.value}
                        className="peer sr-only"
                        name="toneType"
                        onChange={() => {
                          useCustomToneField.handleChange(false);
                          form.setFieldValue("customTone", "");
                        }}
                        type="radio"
                        value="preset"
                      />
                      <div
                        className={`flex size-5 items-center justify-center rounded-full ${
                          useCustomToneField.state.value
                            ? "border-2 border-muted-foreground/30"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {!useCustomToneField.state.value && (
                          <svg
                            aria-hidden="true"
                            className="size-3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={3}
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M5 13l4 4L19 7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className={
                          useCustomToneField.state.value
                            ? "text-muted-foreground text-sm"
                            : "text-sm"
                        }
                      >
                        Tone Profile
                      </span>
                    </label>
                    <Select
                      disabled={useCustomToneField.state.value}
                      onValueChange={(value) => {
                        if (value) {
                          toneProfileField.handleChange(value as ToneProfile);
                        }
                      }}
                      value={toneProfileField.state.value}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <div className="pt-4">
                <form.Field name="customTone">
                  {(customToneField) => (
                    <div className="space-y-3">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          checked={useCustomToneField.state.value}
                          className="peer sr-only"
                          name="toneType"
                          onChange={() => useCustomToneField.handleChange(true)}
                          type="radio"
                          value="custom"
                        />
                        <div
                          className={`flex size-5 items-center justify-center rounded-full ${
                            useCustomToneField.state.value
                              ? "bg-primary text-primary-foreground"
                              : "border-2 border-muted-foreground/30"
                          }`}
                        >
                          {useCustomToneField.state.value && (
                            <svg
                              aria-hidden="true"
                              className="size-3"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={3}
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M5 13l4 4L19 7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm">Custom Tone</span>
                      </label>
                      <Input
                        autoComplete="off"
                        disabled={!useCustomToneField.state.value}
                        id={customToneField.name}
                        onBlur={customToneField.handleBlur}
                        onChange={(e) =>
                          customToneField.handleChange(e.target.value)
                        }
                        placeholder="Add custom tone notes..."
                        value={customToneField.state.value}
                      />
                    </div>
                  )}
                </form.Field>
              </div>
            </fieldset>
          )}
        </form.Field>

        <div className="pt-4">
          <form.Field name="language">
            {(field) => (
              <div className="space-y-2">
                <Label>Language</Label>
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 z-10 text-base leading-none"
                  >
                    {getLanguageFlag(field.state.value)}
                  </span>
                  <Combobox
                    items={LANGUAGE_OPTIONS}
                    onValueChange={(value) => {
                      if (value) {
                        field.handleChange(value);
                      }
                    }}
                    value={field.state.value}
                  >
                    <ComboboxInput
                      className="**:data-[slot=input-group-control]:pl-9"
                      placeholder="Select language..."
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>No language found</ComboboxEmpty>
                      <ComboboxList>
                        {(lang) => (
                          <ComboboxItem key={lang} value={lang}>
                            <span
                              aria-hidden="true"
                              className="text-base leading-none"
                            >
                              {getLanguageFlag(lang)}
                            </span>
                            <span>{lang}</span>
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
              </div>
            )}
          </form.Field>
        </div>

        <div className="pt-4">
          <form.Field name="customInstructions">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Custom Instructions</Label>
                <Textarea
                  className="min-h-25"
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Add any specific instructions for AI-generated content (e.g., avoid certain phrases, always mention specific features, etc.)"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>
        </div>
      </TitleCard>

      <TitleCard className="lg:col-span-2" heading="Target Audience">
        <form.Field name="audience">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Who are you writing for?</Label>
              <Textarea
                className="min-h-30"
                id={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Describe your target audience - their interests, pain points, and what matters to them"
                value={field.state.value}
              />
            </div>
          )}
        </form.Field>
      </TitleCard>
    </div>
  );
}
