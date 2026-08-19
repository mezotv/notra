"use client";

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@notra/ui/components/ui/field";
import { Input } from "@notra/ui/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@notra/ui/components/ui/tabs";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { DiffView } from "@/components/content/diff-view";
import { SKILL_EDITOR_VIEWS } from "@/constants/skills";
import type {
  SkillEditorFormProps,
  SkillEditorView,
} from "@/types/skills/page";

export function SkillEditorForm({
  isSystem,
  savePending,
  nameInput,
  description,
  content,
  originalContent,
  view,
  onViewChange,
  onNameChange,
  onDescriptionChange,
  onContentChange,
}: SkillEditorFormProps) {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl space-y-5">
        <Field>
          <FieldLabel>Name</FieldLabel>
          <Input
            className="max-w-md font-mono"
            disabled={isSystem || savePending}
            onChange={(e) => onNameChange(e.target.value)}
            readOnly={isSystem}
            value={nameInput}
          />
          {isSystem ? (
            <FieldDescription>
              System skills keep a fixed name.
            </FieldDescription>
          ) : (
            <FieldDescription>
              Lowercase letters, digits, and hyphens. Renaming may affect
              references to this skill by name.
            </FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel>
            Description
            <span className="text-destructive">*</span>
          </FieldLabel>
          <Textarea
            className="max-h-32 min-h-20 resize-none overflow-y-auto leading-relaxed"
            disabled={savePending}
            onChange={(e) => onDescriptionChange(e.target.value)}
            value={description}
          />
        </Field>
      </div>

      <Field className="gap-3">
        <Tabs
          className="gap-3"
          onValueChange={(v) => onViewChange(v as SkillEditorView)}
          value={view}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <FieldLabel>
              Content
              <span className="text-destructive">*</span>
            </FieldLabel>
            <TabsList variant="line">
              <TabsTrigger value={SKILL_EDITOR_VIEWS[0]}>Edit</TabsTrigger>
              <TabsTrigger value={SKILL_EDITOR_VIEWS[1]}>Diff</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="edit">
            <Textarea
              className="max-h-[min(70vh,40rem)] min-h-48 resize-none overflow-y-auto font-mono text-sm leading-relaxed"
              disabled={savePending}
              onChange={(e) => onContentChange(e.target.value)}
              spellCheck={false}
              value={content}
            />
          </TabsContent>
          <TabsContent value="diff">
            <div className="min-h-48 overflow-auto rounded-lg border border-border/80 bg-muted/20">
              <DiffView
                currentMarkdown={content}
                originalMarkdown={originalContent}
              />
            </div>
          </TabsContent>
        </Tabs>
      </Field>
    </div>
  );
}
