import type { BlumeConfig } from "blume";

export const docsNavigation = {
  tabs: [
    {
      label: "Documentation",
      path: "/",
      href: "/overview",
    },
    {
      label: "API Reference",
      path: "/api",
      href: "/api/getting-started",
    },
  ],
  featured: [
    {
      label: "Discord Community",
      href: "https://www.usenotra.com/discord",
      icon: "messages-square",
    },
  ],
  sidebar: [
    {
      label: "Get Started",
      items: ["/overview", "/quickstart"],
    },
    {
      label: "Core Concepts",
      items: [
        "/concepts/how-it-works",
        "/concepts/content-pipeline",
        "/concepts/brand-voice",
      ],
    },
    {
      label: "GEO",
      items: [
        "/geo/overview",
        "/geo/prompts-and-competitors",
        "/geo/traffic",
        "/geo/agent-readiness",
        "/geo/content-gaps-and-writer",
      ],
    },
    {
      label: "Integrations",
      items: [
        "/integrations/overview",
        "/integrations/github",
        "/integrations/linear",
        "/integrations/slack",
        "/integrations/granola",
        "/integrations/google-search-console",
        "/integrations/framer",
        "/integrations/featul",
        "/integrations/kontentspace",
      ],
    },
    {
      label: "Developer Tools",
      items: ["/devtools/cli", "/devtools/mcp", "/devtools/raycast"],
    },
    {
      label: "Automation",
      items: [
        "/automation/overview",
        "/automation/event-based",
        "/automation/scheduled",
      ],
    },
    {
      label: "Content Types",
      items: [
        "/content/changelogs",
        "/content/blog-posts",
        "/content/social-media",
      ],
    },
    {
      label: "Organization",
      items: [
        "/organization/workspace-setup",
        "/organization/team-management",
        "/organization/billing",
      ],
    },
    {
      label: "API Reference",
      root: "/api",
      items: [
        {
          label: "Getting Started",
          items: [
            "/api/getting-started",
            "/api/authentication",
            "/api/rate-limits",
          ],
        },
        {
          label: "Guides",
          items: [
            "/api/rust-sdk",
            "/api/caching",
            "/api/common-tasks",
            "/api/pagination",
            "/api/types",
            "/api/agent-feedback",
          ],
        },
        {
          label: "Webhooks",
          items: ["/api/webhooks/overview", "/api/webhooks/events"],
        },
        {
          label: "Endpoints",
          root: "/api/endpoints",
          display: "group",
          collapsed: false,
          items: [
            {
              label: "Discovery",
              display: "group",
              collapsed: false,
              items: ["/api/endpoints/discovery/getpublicapistatus"],
            },
            {
              label: "Posts",
              display: "group",
              collapsed: false,
              items: [
                "/api/endpoints/content/listposts",
                "/api/endpoints/content/getpost",
                "/api/endpoints/content/updatepost",
                "/api/endpoints/content/deletepost",
                {
                  label: "Generation",
                  display: "group",
                  collapsed: false,
                  items: [
                    "/api/endpoints/content/createpostgeneration",
                    "/api/endpoints/content/getpostgeneration",
                  ],
                },
              ],
            },
            {
              label: "Brand Identities",
              display: "group",
              collapsed: false,
              items: [
                "/api/endpoints/content/listbrandidentities",
                "/api/endpoints/content/getbrandidentity",
                "/api/endpoints/content/updatebrandidentity",
                "/api/endpoints/content/deletebrandidentity",
                {
                  label: "Generation",
                  display: "group",
                  collapsed: false,
                  items: [
                    "/api/endpoints/content/createbrandidentity",
                    "/api/endpoints/content/getbrandidentitygeneration",
                  ],
                },
              ],
            },
            {
              label: "Integrations",
              display: "group",
              collapsed: false,
              items: [
                "/api/endpoints/content/listintegrations",
                "/api/endpoints/content/creategithubintegration",
                "/api/endpoints/content/deleteintegration",
              ],
            },
            {
              label: "Schedules",
              display: "group",
              collapsed: false,
              items: [
                "/api/endpoints/schedules/listschedules",
                "/api/endpoints/schedules/createschedule",
                "/api/endpoints/schedules/updateschedule",
                "/api/endpoints/schedules/deleteschedule",
              ],
            },
            {
              label: "Event Triggers",
              display: "group",
              collapsed: false,
              items: [
                "/api/endpoints/event-triggers/listeventtriggers",
                "/api/endpoints/event-triggers/createeventtrigger",
                "/api/endpoints/event-triggers/geteventtrigger",
                "/api/endpoints/event-triggers/updateeventtrigger",
                "/api/endpoints/event-triggers/deleteeventtrigger",
              ],
            },
            {
              label: "Skills",
              display: "group",
              collapsed: false,
              items: [
                "/api/endpoints/skills/listskills",
                "/api/endpoints/skills/createskill",
                "/api/endpoints/skills/getskill",
                "/api/endpoints/skills/patchskill",
                "/api/endpoints/skills/deleteskill",
              ],
            },
            {
              label: "Chats",
              display: "group",
              collapsed: false,
              items: [
                "/api/endpoints/chats/listchats",
                "/api/endpoints/chats/createchat",
                "/api/endpoints/chats/getchatbyexternalchannel",
                "/api/endpoints/chats/getchat",
                "/api/endpoints/chats/postchatmessage",
              ],
            },
            {
              label: "Feedback",
              display: "group",
              collapsed: false,
              items: [
                "/api/endpoints/feedback/submitorganizationfeedback",
                "/api/endpoints/feedback/submitfeedback",
                "/api/endpoints/feedback/listfeedback",
                "/api/endpoints/feedback/getfeedback",
                "/api/endpoints/feedback/updatefeedback",
              ],
            },
            {
              label: "GEO",
              display: "group",
              collapsed: false,
              items: [
                {
                  label: "Projects",
                  display: "group",
                  collapsed: false,
                  items: [
                    "/api/endpoints/geo/listprojects",
                    "/api/endpoints/geo/createproject",
                    "/api/endpoints/geo/getproject",
                    "/api/endpoints/geo/updateproject",
                    "/api/endpoints/geo/deleteproject",
                  ],
                },
                {
                  label: "Settings",
                  display: "group",
                  collapsed: false,
                  items: [
                    "/api/endpoints/geo/getgeosettings",
                    "/api/endpoints/geo/updategeosettings",
                  ],
                },
                {
                  label: "Prompts",
                  display: "group",
                  collapsed: false,
                  items: [
                    "/api/endpoints/geo/listgeoprompts",
                    "/api/endpoints/geo/creategeoprompt",
                    "/api/endpoints/geo/updategeoprompt",
                    "/api/endpoints/geo/deletegeoprompt",
                    "/api/endpoints/geo/importgeoprompts",
                  ],
                },
                {
                  label: "Sequences",
                  display: "group",
                  collapsed: false,
                  items: [
                    "/api/endpoints/geo/listgeosequences",
                    "/api/endpoints/geo/creategeosequence",
                    "/api/endpoints/geo/updategeosequence",
                    "/api/endpoints/geo/deletegeosequence",
                    "/api/endpoints/geo/rungeosequence",
                  ],
                },
                {
                  label: "Competitors",
                  display: "group",
                  collapsed: false,
                  items: [
                    "/api/endpoints/geo/listgeocompetitors",
                    "/api/endpoints/geo/upsertgeocompetitor",
                    "/api/endpoints/geo/suggestgeocompetitors",
                    "/api/endpoints/geo/deletegeocompetitor",
                    "/api/endpoints/geo/importgeocompetitors",
                  ],
                },
                {
                  label: "Scans",
                  display: "group",
                  collapsed: false,
                  items: [
                    "/api/endpoints/geo/creategeoscan",
                    "/api/endpoints/geo/listgeoscans",
                    "/api/endpoints/geo/getgeoscan",
                  ],
                },
                {
                  label: "Visibility",
                  display: "group",
                  collapsed: false,
                  items: [
                    "/api/endpoints/geo/getgeovisibilityoverview",
                    "/api/endpoints/geo/getgeovisibilitytimeseries",
                    "/api/endpoints/geo/getgeovisibilitypromptresults",
                    "/api/endpoints/geo/getgeovisibilitycompetitorshare",
                    "/api/endpoints/geo/getgeovisibilitylanguageshare",
                    "/api/endpoints/geo/getgeovisibilitycompetitordetail",
                  ],
                },
                {
                  label: "Content Gaps and Briefs",
                  display: "group",
                  collapsed: false,
                  items: [
                    "/api/endpoints/geo/listgeocontentgaps",
                    "/api/endpoints/geo/listgeocontentbriefs",
                    "/api/endpoints/geo/plangeocontentbrief",
                    "/api/endpoints/geo/getgeocontentbrief",
                    "/api/endpoints/geo/approvegeocontentbrief",
                  ],
                },
                {
                  label: "Agent Readiness",
                  display: "group",
                  collapsed: false,
                  items: [
                    "/api/endpoints/geo/getgeoagentreadiness",
                    "/api/endpoints/geo/startgeoagentreadinessscan",
                  ],
                },
                {
                  label: "Traffic",
                  display: "group",
                  collapsed: false,
                  items: [
                    "/api/endpoints/geo/getgeotrafficoverview",
                    "/api/endpoints/geo/getgeotrafficlog",
                    "/api/endpoints/geo/listgeotrafficjourneys",
                    "/api/endpoints/geo/getgeotrafficjourney",
                    "/api/endpoints/geo/listgeotrafficpages",
                  ],
                },
                {
                  label: "Traffic Ingest",
                  display: "group",
                  collapsed: false,
                  items: [
                    "/api/endpoints/geo/getgeoingestsetup",
                    "/api/endpoints/geo/issuegeoingesttoken",
                    "/api/endpoints/geo/rotategeoingesttoken",
                  ],
                },
              ],
            },
            {
              label: "Agent",
              display: "group",
              collapsed: false,
              items: [
                "/api/endpoints/agent/createagentsession",
                "/api/endpoints/agent/sendagentsessionmessage",
                "/api/endpoints/agent/streamagentsessionevents",
                "/api/endpoints/agent/listagentchats",
              ],
            },
          ],
        },
      ],
    },
  ],
} satisfies BlumeConfig["navigation"];
