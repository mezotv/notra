export const CONTENT_TITLE_REGEX = /^#\s+(.+)$/m;
export const SAVE_BAR_SELECTOR = "[data-save-bar]";
export const ACTIVITY_PANEL_CLASSNAME =
  "hidden min-h-0 min-w-0 shrink-0 overflow-hidden transition-[width] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none lg:block";
export const ACTIVITY_PANEL_OPEN_WIDTH_CLASSNAME = "w-[calc(24rem+0.5rem+1px)]";
export const ACTIVITY_PANEL_FRAME_CLASSNAME =
  "my-2 mr-2 ml-px flex h-[calc(100%-1rem)] w-96 min-w-0 flex-col rounded-xl border border-sidebar-border bg-muted shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none";
