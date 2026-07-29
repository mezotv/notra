import type { SlackChannelState } from "eve/channels/slack";
import type { NotraSlackStateExtras } from "../types/slack";

export function getNotraSlackState(
  state: SlackChannelState
): SlackChannelState & NotraSlackStateExtras {
  return state;
}
