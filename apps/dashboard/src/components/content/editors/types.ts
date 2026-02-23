import type { TextSelection } from "@/components/chat-input";
import type { EditorRefHandle } from "@/components/content/editor/plugins/editor-ref-plugin";

export interface ContentData {
  id: string;
  title: string;
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
  hasChanges: boolean;
  hasMarkdownChanges: boolean;
  hasTitleChanges: boolean;
}

export interface EditorActions {
  setEditedMarkdown: (markdown: string | null) => void;
  setOriginalMarkdown: (markdown: string) => void;
  setEditingTitle: (title: string | null) => void;
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
