---
description: Use when researching a new customer's company, product, socials, or repository to build their onboarding profile.
---

# Company research procedure

1. Start from the domain. Call `fetch_company_brand` for identity, description, and industry, and `find_company_socials` for their X, LinkedIn, GitHub, and other accounts with normalized handles. If you only have a company name, find the domain with `search_web` first.
2. If you have a repository, call `fetch_github_repo`. The README usually states the product, audience, and positioning in the company's own words.
3. Read the website. `scrape_website` fetches the sitemap-ranked key pages (home, about, product, pricing) in one call. For depth, use `crawl_sitemap` with a urlRegex like `/blog/` or `/changelog/` to list posts, then `scrape_page` on the two or three most recent ones for content pillars and tone.
4. Study their social voice. Call `fetch_recent_tweets` with the Twitter/X handle and read the top posts by engagement. Try `scrape_page` on their LinkedIn company page; if it fails, move on and note it.
5. Derive the tone from evidence: quote two or three phrases from their own copy or tweets and name the register they share (for example: technical and direct, playful, enterprise-formal).
6. Choose three to five content pillars. Each pillar must be a theme their audience searches for, not a feature name.
7. List competitors only when the company names them or when the category is unambiguous.
8. Collect every URL you relied on into the sources of each finding before returning the brief.
