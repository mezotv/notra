import type { PersonaSocial, PersonaSocialUsernames } from "@/types/personas";

export function buildPersonaSocialUsernames(
  socials: PersonaSocial[]
): PersonaSocialUsernames {
  const usernames: PersonaSocialUsernames = {
    twitter: "",
    linkedin: "",
    github: "",
    instagram: "",
    youtube: "",
    tiktok: "",
    website: "",
  };
  for (const social of socials) {
    usernames[social.platform] = social.username;
  }
  return usernames;
}

export function getPersonaSocialsKey(socials: PersonaSocial[]): string {
  return socials
    .map((social) => `${social.platform}:${social.username}`)
    .sort()
    .join("|");
}
