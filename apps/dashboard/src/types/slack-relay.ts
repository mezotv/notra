export interface SlackRelayTarget {
  teamId: string;
  channelId: string;
  threadTs: string;
}

export interface SlackRelayInputMode {
  threadUrl: string | null;
}
