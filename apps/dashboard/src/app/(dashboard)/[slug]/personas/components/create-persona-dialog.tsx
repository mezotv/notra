"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Field, FieldLabel } from "@notra/ui/components/ui/field";
import { Input } from "@notra/ui/components/ui/input";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { useCreatePersona } from "@/lib/hooks/use-personas";
import {
  personaBioSchema,
  personaNameSchema,
  personaTitleSchema,
} from "@/schemas/personas";
import type { CreatePersonaDialogProps } from "@/types/components/personas";

export function CreatePersonaDialog({
  open,
  onOpenChange,
  organizationId,
  slug,
}: CreatePersonaDialogProps) {
  const router = useRouter();
  const createPersona = useCreatePersona(organizationId);

  const form = useForm({
    defaultValues: {
      name: "",
      title: "",
      bio: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const persona = await createPersona.mutateAsync({
          name: value.name,
          title: value.title.trim() ? value.title : null,
          bio: value.bio.trim() ? value.bio : null,
        });
        toast.success(`Persona "${persona.name}" created`);
        onOpenChange(false);
        form.reset();
        router.push(`/${slug}/personas/${persona.id}`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create persona"
        );
      }
    },
  });

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="sm:max-w-[28rem]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Create persona</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            A persona is an individual voice, like a founder or team member,
            that your content can be written as.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) =>
                personaNameSchema.safeParse(value).error?.issues[0]?.message,
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>
                  Name<span className="-ml-1 text-destructive">*</span>
                </FieldLabel>
                <Input
                  aria-invalid={field.state.meta.errors.length > 0}
                  disabled={createPersona.isPending}
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
              </Field>
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
              <Field>
                <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                <Input
                  aria-invalid={field.state.meta.errors.length > 0}
                  disabled={createPersona.isPending}
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Co-founder & CEO"
                  value={field.state.value}
                />
              </Field>
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
              <Field>
                <FieldLabel htmlFor={field.name}>Bio</FieldLabel>
                <Textarea
                  aria-invalid={field.state.meta.errors.length > 0}
                  className="max-h-[8rem] min-h-[5rem]"
                  disabled={createPersona.isPending}
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="A short description of who this persona is."
                  value={field.state.value}
                />
              </Field>
            )}
          </form.Field>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose
              disabled={createPersona.isPending}
              render={<Button variant="outline">Cancel</Button>}
            />
            <Button disabled={createPersona.isPending} type="submit">
              {createPersona.isPending ? "Creating…" : "Create persona"}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
