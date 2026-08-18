const LAST_LOGIN_METHOD_KEY = "notra:last-login-method";

export function getLastUsedLoginMethod(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(LAST_LOGIN_METHOD_KEY);
  } catch {
    return null;
  }
}

export function setLastUsedLoginMethod(method: string) {
  try {
    window.localStorage.setItem(LAST_LOGIN_METHOD_KEY, method);
  } catch {
    return;
  }
}
