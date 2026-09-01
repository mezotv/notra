export const CONTENT_EDITOR_VIEWS = ["rendered", "markdown"] as const;

export type ContentEditorView = (typeof CONTENT_EDITOR_VIEWS)[number];
