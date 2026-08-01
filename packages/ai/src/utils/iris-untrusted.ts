const DELIMITER_TOKEN_PATTERN = /UNTRUSTED_SIGNAL_DATA/gu;
const ANGLE_RUN_PATTERN = /[<>]+/gu;
const CONTROL_LINE_PATTERN = /[\r\n]+/gu;

export const sanitizeUntrustedText = (value: string): string =>
  value
    .replace(CONTROL_LINE_PATTERN, " ")
    .replace(DELIMITER_TOKEN_PATTERN, "untrusted_signal_data")
    .replace(ANGLE_RUN_PATTERN, " ");
