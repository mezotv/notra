import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { nanoid } from "nanoid";
// biome-ignore lint/performance/noNamespaceImport: Required for drizzle schema
import * as schema from "../src/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not defined");
  process.exit(1);
}

const db = drizzle(databaseUrl, { schema });

interface SeedPost {
  title: string;
  content: string;
  markdown: string;
  contentType: "changelog" | "linkedin_post";
  status: "draft" | "published";
}

const SEED_POSTS: SeedPost[] = [
  {
    title: "Version 2.5.0 Release Notes",
    content: `<h1>Version 2.5.0 Release Notes</h1>
<h2>New Features</h2>
<h3>Multi-workspace Support</h3>
<ul>
<li>Create and switch between multiple workspaces</li>
<li>Invite team members to specific workspaces</li>
<li>Role-based access control per workspace</li>
</ul>
<h3>Improved Search</h3>
<ul>
<li>Full-text search across all content</li>
<li>Filter by date, type, and author</li>
<li>Search history and saved queries</li>
</ul>
<h2>Bug Fixes</h2>
<ul>
<li>#1234 - Fixed authentication issues on Safari</li>
<li>#1256 - Resolved memory leaks in dashboard</li>
<li>#1278 - Improved error handling in API calls</li>
</ul>`,
    markdown: `# Version 2.5.0 Release Notes

## New Features

### Multi-workspace Support
- Create and switch between multiple workspaces
- Invite team members to specific workspaces
- Role-based access control per workspace

### Improved Search
- Full-text search across all content
- Filter by date, type, and author
- Search history and saved queries

## Bug Fixes

- #1234 - Fixed authentication issues on Safari
- #1256 - Resolved memory leaks in dashboard
- #1278 - Improved error handling in API calls`,
    contentType: "changelog",
    status: "published",
  },
  {
    title: "Security Update: Two-Factor Authentication",
    content: `<h1>Security Update: Two-Factor Authentication</h1>
<p>We're rolling out two-factor authentication to all accounts.</p>
<h2>Supported Methods</h2>
<ul>
<li>Authenticator apps (Google Authenticator, Authy)</li>
<li>SMS verification</li>
<li>Hardware security keys (YubiKey)</li>
</ul>
<p>Enable 2FA today to secure your account!</p>`,
    markdown: `# Security Update: Two-Factor Authentication

We're rolling out two-factor authentication to all accounts.

## Supported Methods

- Authenticator apps (Google Authenticator, Authy)
- SMS verification
- Hardware security keys (YubiKey)

Enable 2FA today to secure your account!`,
    contentType: "changelog",
    status: "published",
  },
  {
    title: "Version 2.6.0 Release Notes",
    content: `<h1>Version 2.6.0 Release Notes</h1>
<h2>New Features</h2>
<ul>
<li>Bulk import/export functionality</li>
<li>Custom webhook configurations</li>
<li>Advanced filtering options</li>
</ul>
<h2>Improvements</h2>
<ul>
<li>50% faster page load times</li>
<li>Improved accessibility</li>
<li>Better mobile responsiveness</li>
</ul>`,
    markdown: `# Version 2.6.0 Release Notes

## New Features

- Bulk import/export functionality
- Custom webhook configurations
- Advanced filtering options

## Improvements

- 50% faster page load times
- Improved accessibility
- Better mobile responsiveness`,
    contentType: "changelog",
    status: "published",
  },
  {
    title: "Infrastructure Updates: 99.99% Uptime",
    content: `<h1>Infrastructure Updates: 99.99% Uptime</h1>
<p>We've achieved 99.99% uptime for the past 12 months.</p>
<h2>Key Improvements</h2>
<ul>
<li>Multi-region failover</li>
<li>Enhanced monitoring</li>
<li>Automated incident response</li>
</ul>`,
    markdown: `# Infrastructure Updates: 99.99% Uptime

We've achieved 99.99% uptime for the past 12 months.

## Key Improvements

- Multi-region failover
- Enhanced monitoring
- Automated incident response`,
    contentType: "changelog",
    status: "draft",
  },
  {
    title: "Version 2.7.0 - Dark Mode & Performance",
    content: `<h1>Version 2.7.0 - Dark Mode & Performance</h1>
<h2>New Features</h2>
<h3>Dark Mode</h3>
<p>Finally here! Toggle between light, dark, and system themes.</p>
<h3>Keyboard Shortcuts</h3>
<ul>
<li><code>Cmd+K</code> - Quick search</li>
<li><code>Cmd+N</code> - New document</li>
<li><code>Cmd+S</code> - Save changes</li>
</ul>
<h2>Performance</h2>
<ul>
<li>Reduced bundle size by 35%</li>
<li>Lazy loading for all routes</li>
<li>Image optimization with WebP</li>
</ul>`,
    markdown: `# Version 2.7.0 - Dark Mode & Performance

## New Features

### Dark Mode
Finally here! Toggle between light, dark, and system themes.

### Keyboard Shortcuts
- \`Cmd+K\` - Quick search
- \`Cmd+N\` - New document
- \`Cmd+S\` - Save changes

## Performance

- Reduced bundle size by 35%
- Lazy loading for all routes
- Image optimization with WebP`,
    contentType: "changelog",
    status: "published",
  },
  {
    title: "API v3 Released",
    content: `<h1>API v3 Released</h1>
<h2>Breaking Changes</h2>
<ul>
<li>Authentication now uses Bearer tokens</li>
<li>All timestamps are ISO 8601 format</li>
<li>Pagination uses cursor-based approach</li>
</ul>
<h2>New Endpoints</h2>
<ul>
<li><code>POST /v3/batch</code> - Batch operations</li>
<li><code>GET /v3/analytics</code> - Usage analytics</li>
<li><code>POST /v3/webhooks</code> - Webhook management</li>
</ul>
<h2>Migration</h2>
<p>V2 will be deprecated on March 1, 2025. Please migrate before then.</p>`,
    markdown: `# API v3 Released

## Breaking Changes

- Authentication now uses Bearer tokens
- All timestamps are ISO 8601 format
- Pagination uses cursor-based approach

## New Endpoints

- \`POST /v3/batch\` - Batch operations
- \`GET /v3/analytics\` - Usage analytics
- \`POST /v3/webhooks\` - Webhook management

## Migration

V2 will be deprecated on March 1, 2025. Please migrate before then.`,
    contentType: "changelog",
    status: "published",
  },

  {
    title: "Scaling Our Engineering Team",
    content: `<p>We're thrilled to share how our engineering organization has grown from 5 to 50 engineers while maintaining our culture of innovation and quality.</p>
<p><strong>Key Learnings:</strong></p>
<p>1️⃣ Invest in Culture Early</p>
<ul>
<li>Define your values before you scale</li>
<li>Hire for culture add, not just culture fit</li>
<li>Create mentorship programs</li>
</ul>
<p>2️⃣ Build Strong Foundations</p>
<ul>
<li>Documentation is not optional</li>
<li>Automated testing saves time</li>
<li>Code review is a learning opportunity</li>
</ul>
<p>We're continuing to grow and are looking for talented engineers to join our team!</p>
<p>#Engineering #Startup #Growth #Hiring</p>`,
    markdown: `We're thrilled to share how our engineering organization has grown from 5 to 50 engineers while maintaining our culture of innovation and quality.

**Key Learnings:**

1️⃣ Invest in Culture Early
• Define your values before you scale
• Hire for culture add, not just culture fit
• Create mentorship programs

2️⃣ Build Strong Foundations
• Documentation is not optional
• Automated testing saves time
• Code review is a learning opportunity

We're continuing to grow and are looking for talented engineers to join our team!

#Engineering #Startup #Growth #Hiring`,
    contentType: "linkedin_post",
    status: "published",
  },
  {
    title: "Announcing our Series B Funding",
    content: `<p>We're excited to announce that we've raised $50M in Series B funding! 🎉</p>
<p><strong>What This Means:</strong></p>
<ul>
<li>Accelerated product development</li>
<li>Global expansion</li>
<li>Growing our team</li>
</ul>
<p>Thank you to all our customers and investors for believing in our vision!</p>
<p>#Funding #StartupLife #SeriesB</p>`,
    markdown: `We're excited to announce that we've raised $50M in Series B funding! 🎉

**What This Means:**
• Accelerated product development
• Global expansion
• Growing our team

Thank you to all our customers and investors for believing in our vision!

#Funding #StartupLife #SeriesB`,
    contentType: "linkedin_post",
    status: "published",
  },
  {
    title: "Lessons from Building a Remote-First Company",
    content: `<p>3 years ago, we made the decision to go fully remote. Here's what we've learned:</p>
<p>✅ <strong>What works:</strong></p>
<ul>
<li>Async-first communication</li>
<li>Clear documentation</li>
<li>Regular virtual team events</li>
<li>Flexible working hours</li>
</ul>
<p>❌ <strong>What doesn't:</strong></p>
<ul>
<li>Too many meetings</li>
<li>Expecting instant responses</li>
<li>Ignoring time zones</li>
</ul>
<p>Remote work isn't for everyone, but when done right, it's incredibly powerful.</p>
<p>What's your experience with remote work?</p>
<p>#RemoteWork #FutureOfWork #Leadership</p>`,
    markdown: `3 years ago, we made the decision to go fully remote. Here's what we've learned:

✅ **What works:**
• Async-first communication
• Clear documentation
• Regular virtual team events
• Flexible working hours

❌ **What doesn't:**
• Too many meetings
• Expecting instant responses
• Ignoring time zones

Remote work isn't for everyone, but when done right, it's incredibly powerful.

What's your experience with remote work?

#RemoteWork #FutureOfWork #Leadership`,
    contentType: "linkedin_post",
    status: "published",
  },
  {
    title: "The Power of Developer Experience",
    content: `<p>Hot take: Developer Experience (DX) is just as important as User Experience (UX).</p>
<p>Here's why we invest heavily in DX:</p>
<p>📈 <strong>Better DX = Faster shipping</strong></p>
<p>When developers can focus on building features instead of fighting tools, velocity increases.</p>
<p>🐛 <strong>Better DX = Fewer bugs</strong></p>
<p>Good tooling catches errors early. TypeScript, linting, and automated tests aren't overhead—they're insurance.</p>
<p>😊 <strong>Better DX = Happier team</strong></p>
<p>Nobody wants to work with frustrating tools. Great DX improves retention.</p>
<p>What DX improvements have made the biggest impact on your team?</p>
<p>#DeveloperExperience #Engineering #ProductDevelopment</p>`,
    markdown: `Hot take: Developer Experience (DX) is just as important as User Experience (UX).

Here's why we invest heavily in DX:

📈 **Better DX = Faster shipping**
When developers can focus on building features instead of fighting tools, velocity increases.

🐛 **Better DX = Fewer bugs**
Good tooling catches errors early. TypeScript, linting, and automated tests aren't overhead—they're insurance.

😊 **Better DX = Happier team**
Nobody wants to work with frustrating tools. Great DX improves retention.

What DX improvements have made the biggest impact on your team?

#DeveloperExperience #Engineering #ProductDevelopment`,
    contentType: "linkedin_post",
    status: "draft",
  },
  {
    title: "We Just Hit 10,000 Customers",
    content: `<p>🎉 Milestone alert: We just crossed 10,000 customers!</p>
<p>When we started 3 years ago, we had a simple goal: make developers' lives easier.</p>
<p>Some numbers from the journey:</p>
<ul>
<li>10,000+ customers</li>
<li>50M+ API calls per month</li>
<li>99.99% uptime</li>
<li>45 team members across 12 countries</li>
</ul>
<p>None of this would be possible without our amazing team and customers.</p>
<p>Here's to the next 10,000! 🚀</p>
<p>#Milestone #Startup #Growth</p>`,
    markdown: `🎉 Milestone alert: We just crossed 10,000 customers!

When we started 3 years ago, we had a simple goal: make developers' lives easier.

Some numbers from the journey:
• 10,000+ customers
• 50M+ API calls per month
• 99.99% uptime
• 45 team members across 12 countries

None of this would be possible without our amazing team and customers.

Here's to the next 10,000! 🚀

#Milestone #Startup #Growth`,
    contentType: "linkedin_post",
    status: "published",
  },
  {
    title: "Why We Open-Sourced Our Core Library",
    content: `<p>Today we're open-sourcing our core SDK. Here's the thinking behind it:</p>
<p><strong>🤝 Trust through transparency</strong></p>
<p>Developers can see exactly what our code does. No black boxes.</p>
<p><strong>🌍 Community contributions</strong></p>
<p>Our users often know their use cases better than we do. Now they can contribute.</p>
<p><strong>📚 Better documentation</strong></p>
<p>Source code is the ultimate documentation.</p>
<p><strong>🚀 Faster adoption</strong></p>
<p>Lower barrier to entry for developers evaluating our platform.</p>
<p>Check it out on GitHub (link in comments).</p>
<p>#OpenSource #Developer #Engineering</p>`,
    markdown: `Today we're open-sourcing our core SDK. Here's the thinking behind it:

**🤝 Trust through transparency**
Developers can see exactly what our code does. No black boxes.

**🌍 Community contributions**
Our users often know their use cases better than we do. Now they can contribute.

**📚 Better documentation**
Source code is the ultimate documentation.

**🚀 Faster adoption**
Lower barrier to entry for developers evaluating our platform.

Check it out on GitHub (link in comments).

#OpenSource #Developer #Engineering`,
    contentType: "linkedin_post",
    status: "draft",
  },
];

async function seed() {
  console.log("Starting seed...");

  // Get all organizations
  const orgs = await db.select().from(schema.organizations);

  if (orgs.length === 0) {
    console.log("No organizations found. Please create an organization first.");
    process.exit(1);
  }

  console.log(`Found ${orgs.length} organizations`);

  for (const org of orgs) {
    console.log(`Seeding posts for organization: ${org.name} (${org.id})`);

    // Create posts with staggered dates for infinite scroll testing
    const postsToInsert = SEED_POSTS.map((post, index) => {
      const date = new Date();
      // Stagger posts by days going back
      date.setDate(date.getDate() - Math.floor(index / 3));
      date.setHours(date.getHours() - (index % 3) * 4);

      return {
        id: nanoid(),
        organizationId: org.id,
        title: post.title,
        content: post.content,
        markdown: post.markdown,
        contentType: post.contentType,
        status: post.status,
        createdAt: date,
        updatedAt: date,
      };
    });

    // Delete existing posts for this org to prevent duplicates
    await db
      .delete(schema.posts)
      .where(eq(schema.posts.organizationId, org.id));

    await db.insert(schema.posts).values(postsToInsert);
    console.log(`Inserted ${postsToInsert.length} posts for ${org.name}`);
  }

  console.log("Seed completed successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
