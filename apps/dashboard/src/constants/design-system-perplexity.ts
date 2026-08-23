import type { PerplexityStoryMessage } from "@/types/design-system-perplexity";

export const PERPLEXITY_STORY_THREAD: PerplexityStoryMessage[] = [
  {
    id: "u-1",
    from: "user",
    text: "wen hat notion gekauft, um notion mail zu bauen?",
  },
  {
    id: "a-1",
    from: "assistant",
    search: {
      title: "Searching for the acquisition history",
      queries: [
        "Notion acquire company to make Notion Mail",
        "Skiff acquisition Notion 2024",
        "Notion Mail Skiff history",
      ],
      sources: [
        {
          title: "Notion acquires Skiff to expand into email and calendar",
          domain: "techcrunch.com",
          verified: true,
        },
        {
          title: "Encrypted productivity startup Skiff is being shut down",
          domain: "arstechnica.com",
          verified: true,
        },
        {
          title: "Notion Mail launches as the successor to Skiff",
          domain: "theverge.com",
          verified: true,
        },
        {
          title: "What happened to Skiff after the Notion deal",
          domain: "wired.com",
          verified: true,
        },
        {
          title: "Notion buys Skiff in a push into email",
          domain: "bloomberg.com",
          verified: true,
        },
        {
          title: "Why Notion acquired encrypted workplace suite Skiff",
          domain: "theinformation.com",
          verified: true,
        },
        {
          title: "Notion acquires encryption startup Skiff",
          domain: "protocol.com",
          verified: true,
        },
        {
          title: "Notion Mail and the end of Skiff",
          domain: "forbes.com",
          verified: true,
        },
        {
          title: "Notion to acquire encrypted workplace suite Skiff",
          domain: "reuters.com",
          verified: true,
        },
        {
          title: "Notion expands into email with Skiff acquisition",
          domain: "cnbc.com",
          verified: true,
        },
        {
          title: "Inside Notion’s plan for Mail after buying Skiff",
          domain: "businessinsider.com",
          verified: true,
        },
        {
          title: "Skiff’s encryption bet ends at Notion",
          domain: "fastcompany.com",
          verified: true,
        },
        {
          title: "Notion Mail is the successor to Skiff Mail",
          domain: "techradar.com",
          verified: true,
        },
        {
          title: "Notion is shutting down Skiff after the acquisition",
          domain: "engadget.com",
          verified: true,
        },
        {
          title: "Notion Mail launches as Skiff services wind down",
          domain: "zdnet.com",
          verified: true,
        },
        {
          title: "Notion’s Skiff deal puts it in the Workspace race",
          domain: "axios.com",
          verified: true,
        },
      ],
    },
    citations: [
      {
        id: "techcrunch",
        label: "techcrunch",
        domain: "techcrunch.com",
        extra: 2,
      },
      {
        id: "arstechnica",
        label: "arstechnica",
        domain: "arstechnica.com",
        extra: 1,
      },
      {
        id: "theverge",
        label: "theverge",
        domain: "theverge.com",
      },
    ],
    text: "Notion hat **Skiff** gekauft — das Team und die Technik hinter dem, was später **Notion Mail** wurde. {{techcrunch}}\n\n**The acquisition**\n\nAm **9. Februar 2024** übernahm Notion den verschlüsselten Produktivitäts-Startup Skiff. Skiff baute E-Mail, Docs und Calendar mit End-to-End-Verschlüsselung; Notion wollte genau diese Fläche, ohne eine Mail-Suite von null zu schreiben. {{arstechnica}}\n\n**From Skiff to Notion Mail**\n\n- **When:** Februar 2024, Produktlaunch von Notion Mail folgte 2025\n- **What Skiff was:** E2E-verschlüsselte Mail-, Docs- und Calendar-Apps\n- **What Notion did next:** Skiff-Dienste wurden abgewickelt, das Team in Notion integriert, Mail als native Notion-Fläche neu aufgesetzt {{theverge}}",
  },
];

export const PERPLEXITY_STORY_REPLIES = [
  "Kurz: Skiff. Notion hat das Team 2024 übernommen und daraus Notion Mail gebaut.",
  "Genau da. Wenn du willst, ziehe ich die Timeline noch enger.",
  "Passt. Frag nach, wenn du die Produktentscheidung hinter Mail genauer willst.",
] as const;

export const PERPLEXITY_STORY_USER_MESSAGES = PERPLEXITY_STORY_THREAD.filter(
  (message) => message.from === "user"
);

export const PERPLEXITY_STORY_ASSISTANT_MESSAGES =
  PERPLEXITY_STORY_THREAD.filter((message) => message.from === "assistant");
