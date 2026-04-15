import type { EditorRefHandle } from "@/components/content/editor/plugins/editor-ref-plugin";
import type { TextSelection } from "@/schemas/content";

export interface ContentData {
  id: string;
  title: string;
  slug: string | null;
  markdown: string;
  contentType: string;
  date: string;
  sourceMetadata: unknown;
}

export interface EditorState {
  editedMarkdown: string | null;
  originalMarkdown: string;
  editingTitle: string | null;
  serverTitle: string;
  editingSlug: string | null;
  serverSlug: string | null;
  hasChanges: boolean;
  hasMarkdownChanges: boolean;
  hasTitleChanges: boolean;
  hasSlugChanges: boolean;
}

export interface EditorActions {
  setEditedMarkdown: (markdown: string | null) => void;
  setOriginalMarkdown: (markdown: string) => void;
  setEditingTitle: (title: string | null) => void;
  setEditingSlug: (slug: string | null) => void;
  onEditorChange: (markdown: string) => void;
  onSelectionChange: (selection: TextSelection | null) => void;
}

export interface OrganizationInfo {
  name: string;
  logo: string | null;
}

export interface ContentEditorProps {
  content: ContentData;
  state: EditorState;
  actions: EditorActions;
  editorRef: React.RefObject<EditorRefHandle | null>;
  editorKey: number;
  organization?: OrganizationInfo;
}
