import type {
  CommandPaletteState,
  CommandPaletteStateAction,
} from "@/types/components/command-palette";

export function createInitialCommandPaletteState(): CommandPaletteState {
  return {
    hasOpened: false,
    open: false,
    openSource: null,
  };
}

export function commandPaletteReducer(
  state: CommandPaletteState,
  action: CommandPaletteStateAction
): CommandPaletteState {
  return {
    hasOpened: state.hasOpened || action.open,
    open: action.open,
    openSource: action.open ? action.source : null,
  };
}
