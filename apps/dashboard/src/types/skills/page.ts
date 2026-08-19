import type { SKILL_EDITOR_VIEWS } from "@/constants/skills";

export interface SkillDetailPageClientProps {
  slug: string;
  name: string;
}

export type SkillEditorView = (typeof SKILL_EDITOR_VIEWS)[number];

export interface SkillDetailHeaderProps {
  slug: string;
  name: string;
  isSystem: boolean;
  canDelete: boolean;
  deleteDisabled: boolean;
  onDelete: () => void;
}

export interface SkillEditorFormProps {
  isSystem: boolean;
  savePending: boolean;
  nameInput: string;
  description: string;
  content: string;
  originalContent: string;
  view: SkillEditorView;
  onViewChange: (view: SkillEditorView) => void;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onContentChange: (value: string) => void;
}

export interface SkillDeleteDialogProps {
  open: boolean;
  name: string;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}
