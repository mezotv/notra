export const POSTHOG_CAMEL_CASE_BOUNDARY_PATTERN = /([a-z\d])([A-Z])/g;

export const POSTHOG_URL_COMPONENT_PROPERTY_PATTERN =
  /(?:^|[_$.-])(?:search|query|hash|fragment)(?:[_$.-]|$)/i;

export const POSTHOG_URL_PROPERTY_PATTERN =
  /(?:^|[_$.-])(?:url|uri|href|referrer|referer)(?:[_$.-]|$)/i;

export const POSTHOG_URL_SHAPE_PATTERN =
  /^(?:(?:https?|wss?):\/\/|\/\/|\/|\.\/|\.\.\/|[\w.-]+\.[a-z]{2,}(?::\d+)?(?:[/?#]|$)|[a-z\d._~!$&'+,;=@%/-]+\/[a-z\d._~!$&'+,;=@%/-]*[?#])/i;

export const POSTHOG_URL_WHITESPACE_PATTERN = /\s/;
