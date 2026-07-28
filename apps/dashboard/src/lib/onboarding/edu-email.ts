const EDU_DOMAIN_PATTERN = /\.edu(\.[a-z]{2})?$/;

export function isEduEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@").at(-1) ?? "";
  return EDU_DOMAIN_PATTERN.test(domain);
}
