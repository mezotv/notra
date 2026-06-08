import type { EditorRefHandle } from "@/components/content/editor/plugins/editor-ref-plugin";
import type { TextSelection } from "@/schemas/content";

interface ContentData {
  id: string;
  title: string;
  slug: string | null;
  content: string;
  htmlUrl: string | null;
  markdown: string | null;
  rawHtml: string | null;
  contentType: string;
  date: string;
  sourceMetadata: unknown;
}

interface EditorState {
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

interface EditorActions {
  setEditedMarkdown: (markdown: string | null) => void;
  setOriginalMarkdown: (markdown: string) => void;
  setEditingTitle: (title: string | null) => void;
  setEditingSlug: (slug: string | null) => void;
  onEditorChange: (markdown: string) => void;
  onSelectionChange: (selection: TextSelection | null) => void;
}

interface OrganizationInfo {
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
  imageExportRef?: React.RefObject<HTMLDivElement | null>;
}
