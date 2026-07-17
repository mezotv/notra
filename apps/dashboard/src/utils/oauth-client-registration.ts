const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "[::1]", "localhost"]);

export function hasOnlyLoopbackRedirectUris(payload: object): boolean {
  if (!("redirect_uris" in payload) || !Array.isArray(payload.redirect_uris)) {
    return false;
  }

  if (payload.redirect_uris.length === 0) {
    return false;
  }

  return payload.redirect_uris.every((redirectUri) => {
    if (typeof redirectUri !== "string") {
      return false;
    }

    try {
      const url = new URL(redirectUri);
      return (
        url.protocol === "http:" &&
        LOOPBACK_HOSTNAMES.has(url.hostname) &&
        url.username === "" &&
        url.password === ""
      );
    } catch {
      return false;
    }
  });
}
