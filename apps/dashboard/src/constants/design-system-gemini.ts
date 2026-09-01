import type { GeminiStoryMessage } from "@/types/design-system-gemini";

export const GEMINI_STORY_THREAD: GeminiStoryMessage[] = [
  { id: "u-1", from: "user", text: "wie gehts dir" },
  {
    id: "a-1",
    from: "assistant",
    text: "Mir geht's gut, danke — bereit, wenn du bist. Wobei soll ich dir helfen?",
  },
  {
    id: "u-2",
    from: "user",
    text: "denk mal bitte doll nach, was ist cursor wal-on-s3 und wie funktioniert allgemein cursor origin?",
  },
  {
    id: "a-2",
    from: "assistant",
    search: true,
    text: "**Cursor Origin** ist der Cloud-Workspace von Cursor: dein Repo liegt remote, der Agent arbeitet dort weiter, auch wenn der Rechner zu ist.\n\n**wal-on-s3** ist in dem Setup der Object-Store-Pfad — Snapshots und Artifacts landen auf S3, statt nur lokal. Origin synct den Stand, S3 hält die schweren Blobs. Zusammen: Agent in der Cloud, Dateien versioniert, nichts blockiert den Editor.",
  },
];

export const GEMINI_STORY_REPLIES = [
  "Alles klar — sag Bescheid, wenn du weiter machen willst.",
  "Gern. Ich bin da.",
  "Kurz notiert. Was als Nächstes?",
] as const;

export const GEMINI_STORY_USER_MESSAGES = GEMINI_STORY_THREAD.filter(
  (message) => message.from === "user"
);

export const GEMINI_STORY_ASSISTANT_MESSAGES = GEMINI_STORY_THREAD.filter(
  (message) => message.from === "assistant"
);
