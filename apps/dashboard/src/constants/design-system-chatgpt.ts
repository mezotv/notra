import type { ChatgptStoryMessage } from "@/types/design-system-chatgpt";

export const CHATGPT_STORY_THREAD: ChatgptStoryMessage[] = [
  { id: "u-1", from: "user", text: "asfg" },
  { id: "a-1", from: "assistant", text: "😂 was geht?" },
  { id: "u-2", from: "user", text: "wie geht sdir?" },
  {
    id: "a-2",
    from: "assistant",
    text: "Mir geht's gut 😭 bin am Start. Was geht bei dir?",
  },
  { id: "u-3", from: "user", text: "ok top danke" },
  { id: "a-3", from: "assistant", text: "Gerne 😭" },
  {
    id: "u-4",
    from: "user",
    text: "Was sind die wichtigsten News heute?",
  },
  {
    id: "a-4",
    from: "assistant",
    text: "Kurz der Stand von **Montag, 17. August 2026**:\n\nDie G7-Außenminister beraten in Ottawa über ein neues Sanktionspaket, während die Waffenruhe-Gespräche in Genf erneut stocken. In Berlin steht diese Woche das Wachstumspaket auf der Tagesordnung — die Union will Nachbesserungen. An den Märkten eröffnet der DAX fester, nachdem US-Tech überraschend starke Zahlen nachgelegt hat; parallel zieht die Debatte um den AI-Act-Vollzug an.",
    reasoning: {
      seconds: 21,
      text: "Klar. Ich ziehe dir die wichtigsten News von **heute, Montag, 17. August 2026**, zusammen — Fokus auf Weltpolitik, Deutschland, Wirtschaft/Tech und größere aktuelle Ereignisse.",
      search: {
        websites: 6,
        sourceCount: 91,
        sites: [
          { domain: "reuters.com", label: "www.reuters.com" },
          { domain: "theguardian.com", label: "www.theguardian.com" },
          { domain: "apnews.com", label: "apnews.com" },
          { domain: "bbc.com", label: "www.bbc.com" },
          { domain: "ft.com", label: "www.ft.com" },
          { domain: "spiegel.de", label: "www.spiegel.de" },
        ],
        sources: [
          {
            id: "src-1",
            publisher: "Reuters",
            domain: "reuters.com",
            title: "G7 ministers weigh new sanctions as Geneva talks stall",
            snippet:
              "Foreign ministers in Ottawa said a coordinated package remains on the table after overnight consultations.",
            timeLabel: "Today — 3 hours ago",
          },
          {
            id: "src-2",
            publisher: "AP News",
            domain: "apnews.com",
            title: "Ceasefire talks in Geneva hit another delay",
            snippet:
              "Negotiators left the session without a timetable, citing unresolved security guarantees.",
            timeLabel: "Today — 4 hours ago",
          },
          {
            id: "src-3",
            publisher: "The Guardian",
            domain: "theguardian.com",
            title: "Shipping insurers raise rates after Hormuz disruption",
            snippet:
              "Premiums jumped again as operators rerouted tankers away from the strait.",
            timeLabel: "Today — 5 hours ago",
          },
          {
            id: "src-4",
            publisher: "Financial Times",
            domain: "ft.com",
            title: "US tech earnings lift European markets at the open",
            snippet:
              "The DAX tracked overnight gains in megacap software and chips.",
            timeLabel: "Today — 6 hours ago",
          },
          {
            id: "src-5",
            publisher: "Spiegel",
            domain: "spiegel.de",
            title: "Union demands changes before growth package vote",
            snippet:
              "Parliamentary leaders want tighter fiscal language ahead of this week’s Bundestag session.",
            timeLabel: "Today — 7 hours ago",
          },
          {
            id: "src-6",
            publisher: "BBC",
            domain: "bbc.com",
            title: "EU officials outline next steps on AI Act enforcement",
            snippet:
              "Member states are still split on how national regulators should share oversight.",
            timeLabel: "Today — 8 hours ago",
          },
        ],
      },
    },
  },
];

export const CHATGPT_STORY_REPLIES = [
  "Alles klar — sag Bescheid, wenn du weiter machen willst.",
  "Top. Ich bin da.",
  "Gerne. Was als Nächstes?",
] as const;

export const CHATGPT_STORY_USER_MESSAGES = CHATGPT_STORY_THREAD.filter(
  (message) => message.from === "user"
);

export const CHATGPT_STORY_ASSISTANT_MESSAGES = CHATGPT_STORY_THREAD.filter(
  (message) => message.from === "assistant"
);
