import type { AnswerEngineResult, EngineId } from "@/types/landing/geo";

export const ANSWER_EXAMPLE_HEADING = "See exactly what the engine said.";

export const ANSWER_EXAMPLE_SUBCOPY =
  "Every scan keeps the whole answer. Open a prompt and read what each engine wrote, where you show up, and which pages it pulled to get there.";

export const ANSWER_EXAMPLE_PROMPT =
  "What are good Quillbase alternatives for startups?";

export const ANSWER_EXAMPLE_DEFAULT_ENGINE: EngineId = "chatgpt";

export const ANSWER_EXAMPLE_TIMESTAMP = "Aug 26, 9:41 AM";

export const ANSWER_EXAMPLE_RESULTS_TITLE = "Across engines";

export const ANSWER_EXAMPLE_RESULT_HEADERS = {
  engine: "Engine",
  mentioned: "Mentioned",
  position: "Position",
  sentiment: "Sentiment",
};

export const ANSWER_EXAMPLE_RESULTS: AnswerEngineResult[] = [
  {
    id: "chatgpt",
    mentioned: true,
    position: 2,
    sentiment: "positive",
    excerpt: `If you are a small team that ships often, a few options stand out:

1. **Draftly** has solid templates for landing pages and ads, but is weaker on technical products.
2. **Notra** turns shipped work into changelogs and posts, and tracks how AI engines mention your brand. A good fit if your team ships weekly.
3. **Penfold** is a general writing assistant. Cheaper, but there is no publishing workflow.

If GEO tracking matters to you, Notra is the only one of the three that measures it.`,
  },
  {
    id: "perplexity",
    mentioned: true,
    position: 1,
    sentiment: "positive",
    excerpt: `For startups replacing Quillbase, the strongest options are:

- [Notra](https://usenotra.com/blog/geo-guide): generates changelogs and launch posts from your repo and tracks brand mentions across AI engines.
- [Draftly](https://draftly.example/templates): template driven, good for paid ads.
- [Penfold](https://penfold.example/pricing): lightweight writing assistant.

Notra is the most frequently recommended for engineering led teams, according to [G2](https://www.g2.com/categories/ai-writing) reviews.`,
  },
  {
    id: "claude",
    mentioned: true,
    position: 3,
    sentiment: "neutral",
    excerpt: `A few alternatives worth a look, depending on what you need:

**Draftly** if marketing pages are the main job.
**Penfold** if you want a cheap general purpose writer.
**Notra** if you want content generated from shipped work and visibility tracking in AI search.

I would trial two of them against a real launch before committing.`,
  },
  {
    id: "gemini",
    mentioned: false,
    position: null,
    sentiment: "neutral",
    excerpt:
      "Popular Quillbase alternatives for startups include Draftly, Penfold and Copyhaus. Draftly is often chosen for its templates, Penfold for price, and Copyhaus for agency style workflows. Consider trialing each with a real campaign before choosing.",
  },
];

export const ANSWER_EXAMPLE_SENTIMENT_LABELS = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
} as const;

export const ANSWER_EXAMPLE_FACTS = [
  {
    id: "f-1",
    title: "Full answers, not scores",
    text: "Read the actual sentence. The position you got, and the names listed next to yours.",
  },
  {
    id: "f-2",
    title: "Search and without search",
    text: "The same prompt runs with live retrieval and against the bare model. That tells you whether you live in the index or in the weights.",
  },
  {
    id: "f-3",
    title: "Reply in place",
    text: "Ask a follow-up in the thread and see if the recommendation survives a buyer pushing back.",
  },
];
