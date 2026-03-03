import {
  Delete02Icon,
  Edit02Icon,
  MoreVerticalIcon,
  Refresh01Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@notra/ui/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@notra/ui/components/ui/combobox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
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
import { useAsyncDebouncedCallback } from "@tanstack/react-pacer";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { ToneProfile } from "@/schemas/brand";
import { useUpdateBrandSettings } from "../../../../../../lib/hooks/use-brand-analysis";
import {
  AUTO_SAVE_DELAY,
  LANGUAGE_OPTIONS,
  TONE_OPTIONS,
} from "../constants/brand-identity";
import type { BrandFormProps } from "../types/brand-identity";

export function BrandForm({
  organizationId,
  voiceId,
  initialData,
  isDefault,
  onReanalyze,
  isReanalyzing,
  onDelete,
  isDeleting,
  onSetDefault,
  isSettingDefault,
}: BrandFormProps) {
  const updateMutation = useUpdateBrandSettings(organizationId);
  const lastSavedData = useRef<string>(JSON.stringify(initialData));
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditIdentityDialogOpen, setEditIdentityDialogOpen] = useState(false);
  const [identityName, setIdentityName] = useState(initialData.name);

  const debouncedSave = useAsyncDebouncedCallback(
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
      toast.success("Changes saved");
    },
    { wait: AUTO_SAVE_DELAY }
  );

  const form = useForm({
    defaultValues: initialData,
    onSubmit: async () => undefined,
    listeners: {
      onChange: ({ formApi }) => {
        const currentValues = formApi.state.values;
        const currentData = JSON.stringify(currentValues);

        if (currentData === lastSavedData.current) {
          return;
        }

        if (currentValues.useCustomTone && !currentValues.customTone.trim()) {
          return;
        }

        debouncedSave(currentValues).catch((error) => {
          toast.error(
            error instanceof Error ? error.message : "Failed to save changes"
          );
        });
      },
    },
  });

  const handleIdentityRename = async () => {
    const trimmedName = identityName.trim();

    if (!trimmedName) {
      toast.error("Please enter an identity name");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: voiceId,
        name: trimmedName,
      });
      lastSavedData.current = JSON.stringify({
        ...form.state.values,
        name: trimmedName,
      });
      form.setFieldValue("name", trimmedName);
      toast.success("Identity name updated");
      setEditIdentityDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update identity"
      );
    }
  };

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
                <div className="flex w-full flex-row items-center overflow-hidden rounded-lg border border-input bg-background transition-all focus-within:ring-2 focus-within:ring-ring/20">
                  <span className="flex h-10 items-center border-input border-r bg-muted/50 px-3 text-muted-foreground text-sm">
                    https://
                  </span>
                  <input
                    className="h-10 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
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
                  className="min-h-[7.5rem]"
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

      <TitleCard
        action={
          <div className="flex items-center gap-2">
            <form.Subscribe selector={(s) => s.values.websiteUrl}>
              {(websiteUrl) => (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="flex size-8 cursor-pointer items-center justify-center rounded-md border border-input hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isDeleting || isSettingDefault || isReanalyzing}
                  >
                    <HugeiconsIcon
                      className="size-4 text-muted-foreground"
                      icon={MoreVerticalIcon}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuItem
                      onClick={() => setEditIdentityDialogOpen(true)}
                    >
                      <HugeiconsIcon className="size-4" icon={Edit02Icon} />
                      Edit identity name
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!websiteUrl.trim() || isReanalyzing}
                      onClick={() => onReanalyze(websiteUrl)}
                    >
                      <HugeiconsIcon className="size-4" icon={Refresh01Icon} />
                      Re-analyze
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={isDefault}
                      onClick={onSetDefault}
                    >
                      <HugeiconsIcon className="size-4" icon={StarIcon} />
                      {isDefault
                        ? "Already default identity"
                        : "Set as default identity"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={isDefault}
                      onClick={() => setDeleteDialogOpen(true)}
                      variant="destructive"
                    >
                      <HugeiconsIcon className="size-4" icon={Delete02Icon} />
                      Delete identity
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </form.Subscribe>
            <ResponsiveDialog
              onOpenChange={(open) => {
                setEditIdentityDialogOpen(open);
                if (!open) {
                  setIdentityName(form.state.values.name);
                }
              }}
              open={isEditIdentityDialogOpen}
            >
              <ResponsiveDialogContent className="sm:max-w-md">
                <ResponsiveDialogHeader>
                  <ResponsiveDialogTitle>
                    Edit identity name
                  </ResponsiveDialogTitle>
                  <ResponsiveDialogDescription>
                    Update the name used to identify this brand profile.
                  </ResponsiveDialogDescription>
                </ResponsiveDialogHeader>
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleIdentityRename();
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="identity-name">Identity name</Label>
                    <Input
                      autoFocus
                      id="identity-name"
                      onChange={(event) => setIdentityName(event.target.value)}
                      placeholder="e.g. Default, Marketing, Technical"
                      value={identityName}
                    />
                  </div>
                  <ResponsiveDialogFooter>
                    <ResponsiveDialogClose
                      disabled={updateMutation.isPending}
                      render={
                        <Button
                          className="w-full justify-center sm:w-auto"
                          variant="outline"
                        />
                      }
                    >
                      Cancel
                    </ResponsiveDialogClose>
                    <Button
                      className="w-full justify-center sm:w-auto"
                      disabled={
                        !identityName.trim() || updateMutation.isPending
                      }
                      type="submit"
                    >
                      {updateMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </ResponsiveDialogFooter>
                </form>
              </ResponsiveDialogContent>
            </ResponsiveDialog>
            <ResponsiveDialog
              onOpenChange={setDeleteDialogOpen}
              open={isDeleteDialogOpen}
            >
              <ResponsiveDialogContent className="sm:max-w-md">
                <ResponsiveDialogHeader>
                  <ResponsiveDialogTitle>
                    Delete identity?
                  </ResponsiveDialogTitle>
                  <ResponsiveDialogDescription>
                    This removes this brand identity and its saved profile
                    settings. This action cannot be undone.
                  </ResponsiveDialogDescription>
                </ResponsiveDialogHeader>
                <ResponsiveDialogFooter>
                  <ResponsiveDialogClose
                    disabled={isDeleting}
                    render={
                      <Button
                        className="w-full justify-center sm:w-auto"
                        variant="outline"
                      />
                    }
                  >
                    Cancel
                  </ResponsiveDialogClose>
                  <Button
                    className="w-full justify-center sm:w-auto"
                    disabled={isDeleting}
                    onClick={() => {
                      onDelete();
                      setDeleteDialogOpen(false);
                    }}
                    variant="destructive"
                  >
                    {isDeleting ? "Deleting..." : "Delete identity"}
                  </Button>
                </ResponsiveDialogFooter>
              </ResponsiveDialogContent>
            </ResponsiveDialog>
          </div>
        }
        heading="Tone & Language"
      >
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
                <Combobox
                  items={LANGUAGE_OPTIONS}
                  onValueChange={(value) => {
                    if (value) {
                      field.handleChange(value);
                    }
                  }}
                  value={field.state.value}
                >
                  <ComboboxInput placeholder="Select language..." />
                  <ComboboxContent>
                    <ComboboxEmpty>No language found</ComboboxEmpty>
                    <ComboboxList>
                      {(lang) => (
                        <ComboboxItem key={lang} value={lang}>
                          {lang}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
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
                  className="min-h-[6.25rem]"
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
                className="min-h-[7.5rem]"
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
