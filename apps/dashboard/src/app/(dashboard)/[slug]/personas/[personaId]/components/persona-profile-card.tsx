"use client";

import { Upload01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { useUpdatePersona } from "@/lib/hooks/use-personas";
import { uploadFile } from "@/lib/upload/client";
import {
  personaBioSchema,
  personaCustomInstructionsSchema,
  personaNameSchema,
  personaTitleSchema,
} from "@/schemas/personas";
import type { PersonaProfileCardProps } from "@/types/components/personas";

export function PersonaProfileCard({
  organizationId,
  persona,
}: PersonaProfileCardProps) {
  const updatePersona = useUpdatePersona(organizationId);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    e.target.value = "";

    setIsUploadingAvatar(true);
    try {
      const { url } = await uploadFile({ file, type: "persona_avatar" });
      await updatePersona.mutateAsync({
        personaId: persona.id,
        payload: { avatarUrl: url },
      });
      toast.success("Persona avatar updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload avatar"
      );
    }
    setIsUploadingAvatar(false);
  }

  const form = useForm({
    defaultValues: {
      name: persona.name,
      title: persona.title ?? "",
      bio: persona.bio ?? "",
      customInstructions: persona.customInstructions ?? "",
    },
    onSubmit: async ({ value }) => {
      try {
        await updatePersona.mutateAsync({
          personaId: persona.id,
          payload: {
            name: value.name,
            title: value.title.trim() ? value.title : null,
            bio: value.bio.trim() ? value.bio : null,
            customInstructions: value.customInstructions.trim()
              ? value.customInstructions
              : null,
          },
        });
        toast.success("Persona updated");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update persona"
        );
      }
    },
  });

  useEffect(() => {
    form.reset({
      name: persona.name,
      title: persona.title ?? "",
      bio: persona.bio ?? "",
      customInstructions: persona.customInstructions ?? "",
    });
  }, [
    form.reset,
    persona.name,
    persona.title,
    persona.bio,
    persona.customInstructions,
  ]);

  return (
    <TitleCard heading="Profile">
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <div className="flex items-center gap-4">
          <input
            accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
            className="hidden"
            disabled={isUploadingAvatar}
            onChange={handleAvatarChange}
            ref={avatarInputRef}
            type="file"
          />
          <button
            aria-label="Upload persona avatar"
            className="group/avatar relative cursor-pointer disabled:cursor-not-allowed"
            disabled={isUploadingAvatar}
            onClick={() => avatarInputRef.current?.click()}
            type="button"
          >
            <Avatar className="size-16 ring-2 ring-transparent transition-shadow group-hover/avatar:ring-muted-foreground/20">
              <AvatarImage
                alt={persona.name}
                src={persona.avatarUrl ?? undefined}
              />
              <AvatarFallback className="text-xl">
                {persona.name.charAt(0).toUpperCase()}
              </AvatarFallback>
              {isUploadingAvatar && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
                  <Loader2Icon className="size-6 animate-spin" />
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80 opacity-0 transition-opacity group-hover/avatar:opacity-100">
                <HugeiconsIcon className="size-6" icon={Upload01Icon} />
              </span>
            </Avatar>
          </button>
          <div className="space-y-1">
            <p className="font-medium text-sm">Profile picture</p>
            <p className="text-muted-foreground text-xs">
              {isUploadingAvatar
                ? "Uploading..."
                : "Click to upload a new picture"}
            </p>
          </div>
        </div>

        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) =>
              personaNameSchema.safeParse(value).error?.issues[0]?.message,
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Name</Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                id={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Steve Founder"
                value={field.state.value}
              />
              {field.state.meta.errors.length > 0 ? (
                <p className="text-destructive text-xs">
                  {field.state.meta.errors[0]}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field
          name="title"
          validators={{
            onChange: ({ value }) =>
              personaTitleSchema.safeParse(value).error?.issues[0]?.message,
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Title</Label>
              <p className="text-muted-foreground text-xs">
                The persona's role, shown alongside their name.
              </p>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                id={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Co-founder & CEO"
                value={field.state.value}
              />
            </div>
          )}
        </form.Field>

        <form.Field
          name="bio"
          validators={{
            onChange: ({ value }) =>
              personaBioSchema.safeParse(value).error?.issues[0]?.message,
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Bio</Label>
              <p className="text-muted-foreground text-xs">
                Who this person is. Agents use this to write in their voice.
              </p>
              <Textarea
                aria-invalid={field.state.meta.errors.length > 0}
                className="max-h-[10rem] min-h-[5rem]"
                id={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="A short description of who this persona is."
                value={field.state.value}
              />
            </div>
          )}
        </form.Field>

        <form.Field
          name="customInstructions"
          validators={{
            onChange: ({ value }) =>
              personaCustomInstructionsSchema.safeParse(value).error?.issues[0]
                ?.message,
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Writing instructions</Label>
              <p className="text-muted-foreground text-xs">
                How this persona writes: tone, quirks, vocabulary, things they
                would never say.
              </p>
              <Textarea
                aria-invalid={field.state.meta.errors.length > 0}
                className="max-h-[14rem] min-h-[6rem]"
                id={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Writes in short, punchy sentences. Loves shipping in public. Never uses corporate jargon."
                value={field.state.value}
              />
            </div>
          )}
        </form.Field>

        <Button disabled={updatePersona.isPending} type="submit">
          {updatePersona.isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </TitleCard>
  );
}
