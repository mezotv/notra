export const TWEET = {
  name: "Emdash",
  handle: "@emdash",
  time: "2h",
  text: "Custom notification sounds are here 🔊\n\nPick any audio file as your agent event cue, preview it, and fine-tune the timing. Small detail, big difference.",
  replies: "128",
  reposts: "412",
  likes: "3.2K",
  views: "84K",
} as const;

export interface CustomerMessage {
  id: string;
  name: string;
  handle: string;
  text: string;
  accent: string;
}

export const CUSTOMER_MESSAGES: CustomerMessage[] = [
  {
    id: "priya",
    name: "Priya",
    handle: "@priyabuilds",
    text: "finally!! been waiting for custom sounds forever 🙌",
    accent: "#f97316",
  },
  {
    id: "marcus",
    name: "Marcus",
    handle: "@marcusdev",
    text: "ok emdash is cooking 🔥 instant upgrade for our team",
    accent: "#8b5cf6",
  },
  {
    id: "lena",
    name: "Lena",
    handle: "@lenaships",
    text: "this is exactly the detail I didn't know I needed",
    accent: "#0ea5e9",
  },
  {
    id: "theo",
    name: "Theo",
    handle: "@theobuilds",
    text: "just told my whole team about this 👏",
    accent: "#16a34a",
  },
];
