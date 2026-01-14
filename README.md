# Notra

Content Engine for your company so you can focus on what matters!

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

### AI Gateway (Content Editing)

The content editor uses Claude Sonnet 4.5 via Vercel AI Gateway for AI-powered editing:

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) → AI Gateway → API Keys
2. Create a new API key
3. Add it to your `.env.local` as `AI_GATEWAY_API_KEY`
