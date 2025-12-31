"use client";

import Link from "next/link";
import { Streamdown } from "streamdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type ContentType, CONTENT_TYPE_LABELS } from "@/components/content/content-card";

interface PageClientProps {
  contentId: string;
  organizationSlug: string;
}

interface ContentItem {
  id: string;
  title: string;
  content: string;
  contentType: ContentType;
  date: Date;
}

const EXAMPLE_CONTENT: ContentItem[] = [
  {
    id: "1",
    title: "Q4 2024 Product Update",
    content: `# Q4 2024 Product Update

## Executive Summary

This quarter we shipped major improvements to our API performance, reduced latency by 40%, and introduced new authentication methods for enterprise customers.

## Key Achievements

### Performance Improvements

- **API Latency**: Reduced average response time from 250ms to 150ms
- **Database Optimization**: Implemented connection pooling and query caching
- **CDN Integration**: Rolled out global edge caching for static assets

### New Features

1. **Enterprise SSO**: Added support for SAML 2.0 and OIDC authentication
2. **Webhook Events**: New webhook events for real-time notifications
3. **Rate Limiting**: Configurable rate limits per API key

### Security Updates

\`\`\`
- Updated all dependencies to latest secure versions
- Implemented CSP headers across all endpoints
- Added audit logging for sensitive operations
\`\`\`

## Looking Ahead

In Q1 2025, we plan to focus on:
- GraphQL API support
- Multi-region deployment
- Enhanced analytics dashboard

Thank you for your continued support!`,
    contentType: "investor_update",
    date: new Date(),
  },
  {
    id: "2",
    title: "Introducing Dark Mode Support",
    content: `# Introducing Dark Mode Support

We're excited to announce that **dark mode** is now available across all our applications!

## Why Dark Mode?

This highly requested feature helps:
- Reduce eye strain during extended use
- Improve battery life on OLED devices
- Provide a more comfortable viewing experience in low-light environments

## How to Enable

1. Navigate to **Settings**
2. Select **Appearance**
3. Choose your preferred theme:
   - Light
   - Dark
   - System (follows your OS preference)

## Technical Implementation

We've implemented dark mode using CSS custom properties:

\`\`\`css
:root {
  --background: #ffffff;
  --foreground: #000000;
}

.dark {
  --background: #1a1a1a;
  --foreground: #ffffff;
}
\`\`\`

## Feedback Welcome

We'd love to hear your thoughts on our dark mode implementation. Feel free to reach out!`,
    contentType: "blog_post",
    date: new Date(),
  },
  {
    id: "3",
    title: "Just shipped: Real-time collaboration features!",
    content: `# Just shipped: Real-time collaboration features!

Now you can work together with your team in real-time. See changes as they happen and never worry about conflicting edits again.

## What's New

- **Live cursors**: See where your teammates are working
- **Instant sync**: Changes appear immediately for all users
- **Conflict resolution**: Smart merging prevents data loss

Try it out today!

#ProductUpdate #Collaboration #TeamWork`,
    contentType: "twitter_post",
    date: new Date(),
  },
  {
    id: "4",
    title: "Version 2.5.0 Release Notes",
    content: `# Version 2.5.0 Release Notes

*Released: ${new Date().toLocaleDateString()}*

---

## New Features

### Multi-workspace Support
- Create and switch between multiple workspaces
- Invite team members to specific workspaces
- Role-based access control per workspace

### Improved Search
- Full-text search across all content
- Filter by date, type, and author
- Search history and saved queries

### Custom Themes
- Create your own color schemes
- Import/export theme configurations
- Community theme marketplace

---

## Bug Fixes

| Issue | Description | Status |
|-------|-------------|--------|
| #1234 | Fixed authentication issues on Safari | Fixed |
| #1256 | Resolved memory leaks in dashboard | Fixed |
| #1278 | Improved error handling in API calls | Fixed |
| #1290 | Fixed timezone display issues | Fixed |

---

## Breaking Changes

> **Note**: The v1 API endpoints have been deprecated. Please migrate to v2 by January 2025.

## Upgrade Instructions

\`\`\`bash
npm update @your-app/client@2.5.0
\`\`\`

For detailed migration guide, see our documentation.`,
    contentType: "changelog",
    date: new Date(),
  },
  {
    id: "5",
    title: "Scaling Our Engineering Team",
    content: `# Scaling Our Engineering Team

We're thrilled to share how our engineering organization has grown from 5 to 50 engineers while maintaining our culture of innovation and quality.

## Our Journey

When we started, we were a small team of 5 engineers working out of a garage. Today, we have a global team of 50+ engineers across multiple time zones.

## Key Learnings

### 1. Invest in Culture Early
- Define your values before you scale
- Hire for culture add, not just culture fit
- Create mentorship programs

### 2. Build Strong Foundations
- Documentation is not optional
- Automated testing saves time
- Code review is a learning opportunity

### 3. Embrace Remote Work
- Async-first communication
- Clear ownership and accountability
- Regular virtual team building

## What's Next

We're continuing to grow and are looking for talented engineers to join our team. Check out our careers page to see open positions!

#Engineering #Startup #Growth #Hiring`,
    contentType: "linkedin_post",
    date: new Date(),
  },
  {
    id: "6",
    title: "API v3 Migration Guide",
    content: `# API v3 Migration Guide

Everything you need to know about migrating from API v2 to v3.

## Overview

API v3 introduces several improvements:
- Better performance
- More consistent response formats
- Enhanced error messages
- New endpoints for batch operations

## Breaking Changes

### Authentication

**v2 (deprecated)**
\`\`\`javascript
headers: {
  'X-API-Key': 'your-api-key'
}
\`\`\`

**v3 (new)**
\`\`\`javascript
headers: {
  'Authorization': 'Bearer your-api-key'
}
\`\`\`

### Response Format

**v2 Response**
\`\`\`json
{
  "data": { ... },
  "error": null
}
\`\`\`

**v3 Response**
\`\`\`json
{
  "data": { ... },
  "meta": {
    "requestId": "abc123",
    "timestamp": "2024-12-31T00:00:00Z"
  }
}
\`\`\`

## Migration Checklist

- [ ] Update authentication headers
- [ ] Update response parsing logic
- [ ] Test all API endpoints
- [ ] Update error handling
- [ ] Monitor for deprecation warnings

## Need Help?

Contact our support team at support@example.com or join our Discord community.`,
    contentType: "blog_post",
    date: new Date(),
  },
];

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default function PageClient({ contentId, organizationSlug }: PageClientProps) {
  const content = EXAMPLE_CONTENT.find((c) => c.id === contentId);

  if (!content) {
    return (
      <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="w-full space-y-6 px-4 lg:px-6">
          <div className="rounded-xl border border-dashed p-12 text-center">
            <h3 className="font-medium text-lg">Content not found</h3>
            <p className="text-muted-foreground text-sm">
              This content may have been deleted or you don't have access to it.
            </p>
            <Link href={`/${organizationSlug}/content`}>
              <Button className="mt-4" variant="outline">
                Back to Content
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 lg:px-6">
        <div className="space-y-4">
          <Link href={`/${organizationSlug}/content`}>
            <Button size="sm" variant="ghost">
              <svg
                className="mr-2 size-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Back arrow</title>
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
              Back to Content
            </Button>
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="font-bold text-3xl tracking-tight">{content.title}</h1>
              <div className="flex items-center gap-3">
                <time
                  className="text-muted-foreground text-sm"
                  dateTime={content.date.toISOString()}
                >
                  {formatDate(content.date)}
                </time>
                <Badge variant="secondary">
                  {CONTENT_TYPE_LABELS[content.contentType]}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none rounded-lg border bg-card p-6">
          <Streamdown>{content.content}</Streamdown>
        </div>
      </div>
    </div>
  );
}
