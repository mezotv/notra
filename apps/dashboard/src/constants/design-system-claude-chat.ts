import type { ClaudeChatStoryMessage } from "@/types/design-system-claude-chat";

export const CLAUDE_CHAT_STORY_THREAD: ClaudeChatStoryMessage[] = [
  {
    id: "u-1",
    from: "user",
    text: "was sind die news von heute",
  },
  {
    id: "a-1",
    from: "assistant",
    text: "**Wirtschaft (relevant für den Börsentag)**\n\nUS-Tech legt überraschend starke Zahlen nach; der DAX eröffnet fester. Parallel zieht die Debatte um den AI-Act-Vollzug an — Mitgliedstaaten sind sich uneins, wie nationale Aufsichtsbehörden die Kontrolle teilen sollen.\n\n**Sport**\n\nIm Tennis und Fußball bleibt es unruhig: Verletzungen und Transfergerüchte überschatten den Spieltag, während der Ätna erneut Asche ausstößt und den Flugverkehr im Süden stört.",
    search: {
      verb: "Entwirren",
      groups: [
        {
          query: "Nachrichten heute 17. August 2026",
          count: 9,
          results: [
            {
              title: "heute journal vom 17. August 2026",
              domain: "www.zdfheute.de",
            },
            {
              title: "Was heute wichtig ist",
              domain: "www.tagesspiegel.de",
            },
            {
              title: "Newsblog: Die Lage am Montagmorgen",
              domain: "www.spiegel.de",
            },
          ],
        },
        {
          query: "Deutschland Politik Wirtschaft 17. August 2026",
          count: 10,
          results: [
            {
              title: "Union demands changes before growth package vote",
              domain: "www.spiegel.de",
            },
            {
              title: "G7 ministers weigh new sanctions as Geneva talks stall",
              domain: "www.reuters.com",
            },
            {
              title: "EU officials outline next steps on AI Act enforcement",
              domain: "www.bbc.com",
            },
          ],
        },
      ],
      steps: [
        {
          icon: "clock",
          label: "Zusammenfassend aktuelle Ereignisse…",
        },
        { icon: "error", label: "Abrufen fehlgeschlagen" },
        { icon: "check", label: "Fertig" },
      ],
    },
    sources: [
      { label: "Finanz und Wirtschaft", extra: 2 },
      { label: "Tagesspiegel" },
    ],
  },
  {
    id: "u-2",
    from: "user",
    text: "kurz",
  },
  {
    id: "a-2",
    from: "assistant",
    text: "Kurzfassung, Sir:\n\n- **Waldbrände** im Süden weiter außer Kontrolle\n- **Busunglück** fordert mehrere Verletzte\n- **Ätna** stößt erneut Asche aus",
  },
];

export const CLAUDE_CHAT_STORY_REPLIES = [
  "Alles klar — sag Bescheid, wenn du weiter machen willst.",
  "Gern. Ich bin da.",
  "Kurz notiert. Was als Nächstes?",
] as const;

export const CLAUDE_CHAT_STORY_USER_MESSAGES = CLAUDE_CHAT_STORY_THREAD.filter(
  (message) => message.from === "user"
);

export const CLAUDE_CHAT_STORY_ASSISTANT_MESSAGES =
  CLAUDE_CHAT_STORY_THREAD.filter((message) => message.from === "assistant");
