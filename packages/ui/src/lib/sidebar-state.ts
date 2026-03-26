const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function getSidebarOpenFromCookie(cookieValue?: string) {
  return cookieValue !== "false";
}

export {
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_COOKIE_NAME,
  getSidebarOpenFromCookie,
};
