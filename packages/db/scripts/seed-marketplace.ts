import "dotenv/config";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
// biome-ignore lint/performance/noNamespaceImport: Required for drizzle schema
import * as schema from "../src/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not defined");
  process.exit(1);
}

const db = drizzle(databaseUrl, { schema });

interface SeedReference {
  id: string;
  type: "twitter_post" | "linkedin_post" | "blog_post" | "custom";
  content: string;
  metadata: Record<string, unknown> | null;
  note: string | null;
  applicableTo: ("all" | "twitter" | "linkedin" | "blog")[];
}

interface SeedBrand {
  slug: string;
  companyName: string;
  companyDescription: string;
  websiteUrl: string;
  accentColor: string;
  toneProfile: string;
  customTone: string | null;
  audience: string;
  language: string;
  customInstructions: string | null;
  category: string;
  featured: boolean;
  references: SeedReference[];
}

const SEED_BRANDS: SeedBrand[] = [
  {
    slug: "stripe",
    companyName: "Stripe",
    companyDescription:
      "Financial infrastructure for the internet. Millions of companies use Stripe to accept payments, grow their revenue, and accelerate new business opportunities.",
    websiteUrl: "https://stripe.com",
    accentColor: "#635BFF",
    toneProfile: "Professional",
    customTone: null,
    audience:
      "Developers, product managers, and CTOs building payment systems and financial infrastructure",
    language: "English",
    customInstructions:
      "Always lead with the developer experience. Be precise with technical details but accessible to non-engineers. Avoid marketing fluff — let the product speak. Use code examples when relevant.",
    category: "payments",
    featured: true,
    references: [
      {
        id: randomUUID(),
        type: "twitter_post",
        content:
          "We just launched Stripe Billing v2 — rebuilt from the ground up.\n\nFaster invoice rendering, smarter dunning, and a completely new dashboard for managing subscriptions at scale.\n\nThe API is backwards-compatible. Upgrade in minutes.",
        metadata: {
          authorName: "Patrick Collison",
          authorHandle: "patrickc",
          authorUrl: "https://stripe.com",
          verified: "blue",
          likes: 2841,
          retweets: 412,
          replies: 89,
        },
        note: "Product launch announcement — concise, technical, confident",
        applicableTo: ["twitter"],
      },
      {
        id: randomUUID(),
        type: "twitter_post",
        content:
          "Stripe now processes payments in 46 countries with local acquiring.\n\nFor most merchants, this means 2-3% higher authorization rates and significantly lower cross-border fees.\n\nNo integration changes needed.",
        metadata: {
          authorName: "Stripe",
          authorHandle: "stripe",
          authorUrl: "https://stripe.com",
          verified: "gold",
          likes: 1523,
          retweets: 287,
          replies: 42,
        },
        note: "Feature expansion — data-driven, specific numbers, clear benefit",
        applicableTo: ["twitter"],
      },
      {
        id: randomUUID(),
        type: "blog_post",
        content:
          "Building a payment system is deceptively complex. What starts as a simple checkout form quickly becomes a maze of edge cases: failed charges, partial refunds, subscription upgrades mid-cycle, tax calculations across jurisdictions, and fraud detection that doesn't block legitimate customers.\n\nWe've spent the last decade solving these problems so you don't have to. Our latest release focuses on three areas where we heard the most feedback: faster settlement times, better webhook reliability, and a unified API for one-time and recurring payments.",
        metadata: null,
        note: "Blog intro — empathetic, problem-first, then solution",
        applicableTo: ["blog"],
      },
      {
        id: randomUUID(),
        type: "custom",
        content:
          "Stripe Terminal: Accept in-person payments with the same APIs you use online. One integration. Every channel. Ship your point-of-sale experience in days, not months.",
        metadata: null,
        note: "Product one-liner — tight, action-oriented",
        applicableTo: ["all"],
      },
    ],
  },
  {
    slug: "resend",
    companyName: "Resend",
    companyDescription:
      "Email for developers. Build, test, and send transactional emails at scale with a modern API designed for developers who care about deliverability.",
    websiteUrl: "https://resend.com",
    accentColor: "#000000",
    toneProfile: "Conversational",
    customTone: null,
    audience:
      "Developers building email features, startup founders, and engineering teams who want reliable email delivery",
    language: "English",
    customInstructions:
      "Keep it simple and direct. Developers hate verbose docs. Show code first, explain second. Be opinionated about best practices. Light humor is fine but never at the expense of clarity.",
    category: "email",
    featured: true,
    references: [
      {
        id: randomUUID(),
        type: "twitter_post",
        content:
          "We just launched Resend Audiences.\n\nSend marketing emails to segmented lists with the same API you use for transactional email.\n\nOne SDK. One dashboard. No more juggling Mailchimp + your transactional provider.",
        metadata: {
          authorName: "Zeno Rocha",
          authorHandle: "zenorocha",
          authorUrl: "https://resend.com",
          verified: "blue",
          likes: 1892,
          retweets: 234,
          replies: 67,
        },
        note: "Product launch — problem/solution framing, developer-first",
        applicableTo: ["twitter"],
      },
      {
        id: randomUUID(),
        type: "twitter_post",
        content:
          "Emails are broken.\n\nThe average developer spends 3 weeks integrating email. Most of that time is fighting SMTP configs, dealing with bounces, and wondering why emails land in spam.\n\nWe built Resend to make this a 15-minute task.",
        metadata: {
          authorName: "Zeno Rocha",
          authorHandle: "zenorocha",
          authorUrl: "https://resend.com",
          verified: "blue",
          likes: 3201,
          retweets: 567,
          replies: 124,
        },
        note: "Origin story / manifesto style — emotional hook, then value prop",
        applicableTo: ["twitter"],
      },
      {
        id: randomUUID(),
        type: "blog_post",
        content:
          "React Email started as a side project to make email templates less painful. Instead of wrestling with table-based layouts and inline styles, you write components in React and we compile them to battle-tested HTML that renders correctly across every email client.\n\nToday, React Email is used by over 50,000 developers. And with the new Resend integration, you can go from JSX to delivered email in three lines of code.",
        metadata: null,
        note: "Blog narrative — origin story, growth proof, seamless product tie-in",
        applicableTo: ["blog"],
      },
    ],
  },
  {
    slug: "cloudflare",
    companyName: "Cloudflare",
    companyDescription:
      "The connectivity cloud. Cloudflare protects and accelerates websites, APIs, and applications with a global network spanning 300+ cities.",
    websiteUrl: "https://cloudflare.com",
    accentColor: "#F6821F",
    toneProfile: "Professional",
    customTone: "Authoritative but accessible",
    audience:
      "Platform engineers, security teams, DevOps professionals, and developers building on the edge",
    language: "English",
    customInstructions:
      "Lead with scale and reliability numbers. Be technically precise — our audience knows infrastructure. Explain complex concepts clearly without dumbing them down. Reference real-world impact when possible.",
    category: "cloud",
    featured: true,
    references: [
      {
        id: randomUUID(),
        type: "blog_post",
        content:
          "Last Tuesday at 14:32 UTC, a configuration change in our Atlanta data center triggered an unexpected cascade that affected 5% of requests globally for 47 minutes. We want to walk through exactly what happened, why our automated systems didn't catch it sooner, and the three specific changes we've made to prevent this class of incident from recurring.\n\nTransparency isn't optional when you handle 20% of web traffic. Here's the full timeline.",
        metadata: null,
        note: "Incident report — radical transparency, specific numbers, accountability",
        applicableTo: ["blog"],
      },
      {
        id: randomUUID(),
        type: "blog_post",
        content:
          "Workers AI now supports 15 new models including Llama 3.1 405B, Mistral Large, and Stable Diffusion XL. Run inference at the edge with zero cold starts.\n\nThe best part: you pay per request, not per GPU-hour. No capacity planning. No idle costs. Deploy a model in 3 lines of code and scale to millions of requests automatically.",
        metadata: null,
        note: "Product announcement — technical depth, clear pricing model, scale emphasis",
        applicableTo: ["blog"],
      },
      {
        id: randomUUID(),
        type: "twitter_post",
        content:
          "Cloudflare just mitigated the largest DDoS attack ever recorded: 26M requests per second.\n\nDetected in 3 seconds. Mitigated automatically. Zero customer impact.\n\nHere's how our systems handled it →",
        metadata: {
          authorName: "Cloudflare",
          authorHandle: "Cloudflare",
          authorUrl: "https://cloudflare.com",
          verified: "gold",
          likes: 4521,
          retweets: 1823,
          replies: 312,
        },
        note: "Security announcement — dramatic hook, specific metrics, confidence",
        applicableTo: ["twitter"],
      },
      {
        id: randomUUID(),
        type: "custom",
        content:
          "Cloudflare R2: S3-compatible object storage with zero egress fees. Store your data where your users are — on the world's most connected cloud network. No bandwidth bills. No vendor lock-in. No surprises.",
        metadata: null,
        note: "Product positioning — competitive framing, triple negative for emphasis",
        applicableTo: ["all"],
      },
    ],
  },
  {
    slug: "vercel",
    companyName: "Vercel",
    companyDescription:
      "The Frontend Cloud. Vercel provides the developer experience and infrastructure to build, scale, and secure a faster, more personalized web.",
    websiteUrl: "https://vercel.com",
    accentColor: "#000000",
    toneProfile: "Professional",
    customTone: "Polished and forward-thinking",
    audience:
      "Frontend developers, full-stack teams, engineering leaders, and design engineers building modern web applications",
    language: "English",
    customInstructions:
      "Emphasize developer experience and performance. Connect features to real business outcomes (Core Web Vitals, conversion rates, developer velocity). Use precise language — avoid vague claims. Reference the Next.js ecosystem naturally without being heavy-handed.",
    category: "devtools",
    featured: true,
    references: [
      {
        id: randomUUID(),
        type: "twitter_post",
        content:
          "Next.js 15 is here.\n\n• React 19 support\n• Partial Prerendering (stable)\n• next/after for post-response work\n• Turbopack dev (stable)\n• New caching defaults\n\nUpgrade today. Most apps: zero breaking changes.",
        metadata: {
          authorName: "Vercel",
          authorHandle: "vercel",
          authorUrl: "https://vercel.com",
          verified: "gold",
          likes: 5234,
          retweets: 1456,
          replies: 423,
        },
        note: "Major release — bullet-point format, clear upgrade path, confidence",
        applicableTo: ["twitter"],
      },
      {
        id: randomUUID(),
        type: "twitter_post",
        content:
          "We analyzed 3.2 million deployments on Vercel last month.\n\nSites using Partial Prerendering saw:\n→ 38% faster TTFB\n→ 22% better LCP\n→ 15% higher conversion rates\n\nPerformance isn't a feature. It's the product.",
        metadata: {
          authorName: "Guillermo Rauch",
          authorHandle: "rauchg",
          authorUrl: "https://vercel.com",
          verified: "blue",
          likes: 3892,
          retweets: 891,
          replies: 198,
        },
        note: "Data-driven insight — specific metrics, provocative closing line",
        applicableTo: ["twitter"],
      },
      {
        id: randomUUID(),
        type: "blog_post",
        content:
          "The modern web has a caching problem. Developers either over-cache (serving stale content) or under-cache (burning compute on every request). Neither is acceptable at scale.\n\nPartial Prerendering solves this by combining the best of static and dynamic rendering in a single request. The static shell loads instantly from the edge. Dynamic content streams in as it's ready. No configuration. No trade-offs. Just fast.",
        metadata: null,
        note: "Technical blog — problem framing, elegant solution, bold claims backed by architecture",
        applicableTo: ["blog"],
      },
      {
        id: randomUUID(),
        type: "custom",
        content:
          "Vercel: Develop. Preview. Ship. Every push gets a preview deployment. Every merge goes to production. Your frontend workflow, perfected.",
        metadata: null,
        note: "Brand tagline expansion — three-word rhythm, then elaboration",
        applicableTo: ["all"],
      },
    ],
  },
];

async function seedMarketplace() {
  console.log("Seeding marketplace brands...");

  for (const brand of SEED_BRANDS) {
    const existing = await db.query.marketplaceBrands.findFirst({
      where: eq(schema.marketplaceBrands.slug, brand.slug),
      columns: { id: true },
    });

    if (existing) {
      console.log(`  Updating: ${brand.companyName}`);
      await db
        .update(schema.marketplaceBrands)
        .set({
          companyName: brand.companyName,
          companyDescription: brand.companyDescription,
          websiteUrl: brand.websiteUrl,
          accentColor: brand.accentColor,
          toneProfile: brand.toneProfile,
          customTone: brand.customTone,
          audience: brand.audience,
          language: brand.language,
          customInstructions: brand.customInstructions,
          category: brand.category,
          featured: brand.featured,
          references: brand.references,
        })
        .where(eq(schema.marketplaceBrands.id, existing.id));
    } else {
      console.log(`  Creating: ${brand.companyName}`);
      await db.insert(schema.marketplaceBrands).values({
        id: randomUUID(),
        slug: brand.slug,
        companyName: brand.companyName,
        companyDescription: brand.companyDescription,
        websiteUrl: brand.websiteUrl,
        accentColor: brand.accentColor,
        toneProfile: brand.toneProfile,
        customTone: brand.customTone,
        audience: brand.audience,
        language: brand.language,
        customInstructions: brand.customInstructions,
        category: brand.category,
        featured: brand.featured,
        references: brand.references,
      });
    }
  }

  console.log(`Done. Seeded ${SEED_BRANDS.length} brands.`);
  process.exit(0);
}

seedMarketplace().catch((error) => {
  console.error("Failed to seed marketplace:", error);
  process.exit(1);
});
