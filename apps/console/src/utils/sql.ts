const LIKE_SPECIAL_CHARACTERS_REGEX = /[\\%_]/g;

export function escapeLikePattern(value: string) {
  return value.replace(LIKE_SPECIAL_CHARACTERS_REGEX, "\\$&");
}
