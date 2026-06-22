import type {
  SocialPreviewAction,
  SocialPreviewState,
} from "@/types/content/ai-preview";

export function socialPreviewReducer(
  state: SocialPreviewState,
  action: SocialPreviewAction
): SocialPreviewState {
  switch (action.type) {
    case "userActionChanged":
      return { ...state, userAction: action.userAction };
    case "draftMarkdownChanged":
      return { ...state, draftMarkdown: action.draftMarkdown };
    case "regenerateOpenChanged":
      return { ...state, regenerateOpen: action.open };
    case "regenerateOpenToggled":
      return { ...state, regenerateOpen: !state.regenerateOpen };
    case "regenerateInstructionsChanged":
      return { ...state, regenerateInstructions: action.instructions };
    case "openChanged":
      return { ...state, isOpen: action.open };
    default:
      return state;
  }
}
