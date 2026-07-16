const MCP_OAUTH_POPUP_CHANNEL = "notra:mcp-oauth";
const MCP_OAUTH_POPUP_MESSAGE = "notra:mcp-oauth-complete";
const MCP_OAUTH_POPUP_NAME_PREFIX = "notra-mcp-oauth";
const MCP_OAUTH_POPUP_WIDTH = 600;
const MCP_OAUTH_POPUP_HEIGHT = 720;

function getCompletionUrl(value: unknown, popupId: string) {
  if (!(value && typeof value === "object")) {
    return undefined;
  }
  if (!("type" in value && value.type === MCP_OAUTH_POPUP_MESSAGE)) {
    return undefined;
  }
  if (!("url" in value && typeof value.url === "string")) {
    return undefined;
  }
  if (!("popupId" in value && value.popupId === popupId)) {
    return undefined;
  }
  return value.url;
}

export function openMcpOAuthPopup() {
  const popupId = crypto.randomUUID();
  const popupName = `${MCP_OAUTH_POPUP_NAME_PREFIX}-${popupId}`;
  const left = Math.max(
    0,
    window.screenLeft + (window.outerWidth - MCP_OAUTH_POPUP_WIDTH) / 2
  );
  const top = Math.max(
    0,
    window.screenTop + (window.outerHeight - MCP_OAUTH_POPUP_HEIGHT) / 2
  );
  const popup = window.open(
    "about:blank",
    popupName,
    [
      "popup=yes",
      `width=${MCP_OAUTH_POPUP_WIDTH}`,
      `height=${MCP_OAUTH_POPUP_HEIGHT}`,
      `left=${Math.round(left)}`,
      `top=${Math.round(top)}`,
      "resizable=yes",
      "scrollbars=yes",
    ].join(",")
  );

  let disposed = false;
  const channel =
    typeof BroadcastChannel === "undefined"
      ? undefined
      : new BroadcastChannel(MCP_OAUTH_POPUP_CHANNEL);

  const dispose = () => {
    if (disposed) {
      return;
    }
    disposed = true;
    window.removeEventListener("message", handleWindowMessage);
    channel?.removeEventListener("message", handleChannelMessage);
    channel?.close();
  };
  const complete = (value: unknown) => {
    const url = getCompletionUrl(value, popupId);
    if (!url) {
      return;
    }
    const destination = new URL(url, window.location.origin);
    if (destination.origin !== window.location.origin) {
      return;
    }
    dispose();
    window.location.assign(destination.href);
  };
  const handleWindowMessage = (event: MessageEvent) => {
    if (event.origin === window.location.origin && event.source === popup) {
      complete(event.data);
    }
  };
  const handleChannelMessage = (event: MessageEvent) => {
    complete(event.data);
  };

  window.addEventListener("message", handleWindowMessage);
  channel?.addEventListener("message", handleChannelMessage);

  if (popup) {
    popup.focus();
  }

  return {
    close() {
      dispose();
      popup?.close();
    },
    navigate(url: string) {
      if (popup && !popup.closed) {
        popup.location.assign(url);
        popup.focus();
        return;
      }
      dispose();
      window.location.assign(url);
    },
  };
}

export function createMcpOAuthPopupCompletionResponse(url: string) {
  const messageType = JSON.stringify(MCP_OAUTH_POPUP_MESSAGE);
  const completionUrl = JSON.stringify(url).replaceAll("<", "\\u003c");
  const fallbackUrl = JSON.stringify(url).replaceAll("<", "\\u003c");
  const popupNamePrefix = JSON.stringify(MCP_OAUTH_POPUP_NAME_PREFIX);
  const channelName = JSON.stringify(MCP_OAUTH_POPUP_CHANNEL);

  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Authorization complete</title></head><body><p>Authorization complete. You can close this window.</p><script>const prefix=${popupNamePrefix}+"-";const popupId=window.name.startsWith(prefix)?window.name.slice(prefix.length):null;const payload={type:${messageType},url:${completionUrl},popupId};if(popupId&&window.opener&&!window.opener.closed){window.opener.postMessage(payload,window.location.origin);window.close()}else if(popupId&&typeof BroadcastChannel!=="undefined"){const channel=new BroadcastChannel(${channelName});channel.postMessage(payload);channel.close();window.close()}else{window.location.replace(${fallbackUrl})}</script></body></html>`,
    {
      headers: {
        "cache-control": "no-store",
        "content-type": "text/html; charset=utf-8",
      },
    }
  );
}
