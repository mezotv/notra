import type { AuthTestimonial } from "@/types/auth/testimonial";

export const AUTH_TESTIMONIALS: AuthTestimonial[] = [
  {
    quote:
      "Notra is connected to our entire content pipeline. It creates valuable content from our PRs that our audience actually want to read. There's now no more relevant features that are shipped and not talked about. Notra closes that loop for us.",
    name: "Will De Ath",
    role: "Head of Growth, Inth (YC P26)",
    avatarSrc: "/testimonials/will.webp",
  },
  {
    quote:
      "Super easy to get regular marketing content as a baseline. We don't push the content directly, but take it as inspiration and baseline to then make edits. It basically aggregates our development into posts.",
    name: "Glenn Töws",
    role: "Founder, stagewise (YC S25)",
    avatarSrc: "/testimonials/glenn.png",
  },
  {
    quote:
      "It's literally removed the hassle of writing changelogs completely. I just have a schedule run once a week and auto update on my website. With some custom instructions it sounds just like I want it to sound.",
    name: "Jan Burzinski",
    role: "Founder, bejanic.de",
    avatarSrc: "/testimonials/jan.png",
  },
];

export const AUTH_TESTIMONIAL_INTERVAL_MS = 6000;
