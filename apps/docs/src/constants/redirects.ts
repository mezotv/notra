import type { BlumeConfig } from "blume";

// Keep published URLs stable when page titles and generated operation slugs change.
export const docsRedirects = [
  {
    from: "/",
    to: "/overview",
    status: 301,
  },
  {
    from: "/api",
    to: "/api/getting-started",
    status: 301,
  },
  {
    from: "/api-reference/openapi.json",
    to: "https://api.usenotra.com/openapi.json",
    status: 302,
  },
  {
    from: "/sdk/getting-started",
    to: "/api/getting-started",
    status: 301,
  },
  {
    from: "/integrations/mcp",
    to: "/devtools/mcp",
    status: 301,
  },
  {
    from: "/api-reference/discovery/check-public-api-reachability",
    to: "/api/endpoints/discovery/getpublicapistatus",
    status: 301,
  },
  {
    from: "/api-reference/content/list-posts",
    to: "/api/endpoints/content/listposts",
    status: 301,
  },
  {
    from: "/api-reference/content/get-a-single-post",
    to: "/api/endpoints/content/getpost",
    status: 301,
  },
  {
    from: "/api-reference/content/delete-a-single-post",
    to: "/api/endpoints/content/deletepost",
    status: 301,
  },
  {
    from: "/api-reference/content/update-a-single-post",
    to: "/api/endpoints/content/updatepost",
    status: 301,
  },
  {
    from: "/api-reference/content/queue-async-post-generation",
    to: "/api/endpoints/content/createpostgeneration",
    status: 301,
  },
  {
    from: "/api-reference/content/get-async-post-generation-status",
    to: "/api/endpoints/content/getpostgeneration",
    status: 301,
  },
  {
    from: "/api-reference/content/list-available-brand-identities",
    to: "/api/endpoints/content/listbrandidentities",
    status: 301,
  },
  {
    from: "/api-reference/content/queue-async-brand-identity-generation",
    to: "/api/endpoints/content/createbrandidentity",
    status: 301,
  },
  {
    from: "/api-reference/content/get-async-brand-identity-generation-status",
    to: "/api/endpoints/content/getbrandidentitygeneration",
    status: 301,
  },
  {
    from: "/api-reference/content/get-a-single-brand-identity",
    to: "/api/endpoints/content/getbrandidentity",
    status: 301,
  },
  {
    from: "/api-reference/content/delete-a-single-brand-identity",
    to: "/api/endpoints/content/deletebrandidentity",
    status: 301,
  },
  {
    from: "/api-reference/content/update-a-single-brand-identity",
    to: "/api/endpoints/content/updatebrandidentity",
    status: 301,
  },
  {
    from: "/api-reference/content/list-available-integrations",
    to: "/api/endpoints/content/listintegrations",
    status: 301,
  },
  {
    from: "/api-reference/content/create-a-github-integration",
    to: "/api/endpoints/content/creategithubintegration",
    status: 301,
  },
  {
    from: "/api-reference/content/delete-a-single-integration",
    to: "/api/endpoints/content/deleteintegration",
    status: 301,
  },
  {
    from: "/api-reference/schedules/list-schedules",
    to: "/api/endpoints/schedules/listschedules",
    status: 301,
  },
  {
    from: "/api-reference/schedules/create-a-schedule",
    to: "/api/endpoints/schedules/createschedule",
    status: 301,
  },
  {
    from: "/api-reference/schedules/delete-a-schedule",
    to: "/api/endpoints/schedules/deleteschedule",
    status: 301,
  },
  {
    from: "/api-reference/schedules/update-a-schedule",
    to: "/api/endpoints/schedules/updateschedule",
    status: 301,
  },
  {
    from: "/api-reference/event-triggers/list-event-triggers",
    to: "/api/endpoints/event-triggers/listeventtriggers",
    status: 301,
  },
  {
    from: "/api-reference/event-triggers/create-an-event-trigger",
    to: "/api/endpoints/event-triggers/createeventtrigger",
    status: 301,
  },
  {
    from: "/api-reference/event-triggers/get-an-event-trigger",
    to: "/api/endpoints/event-triggers/geteventtrigger",
    status: 301,
  },
  {
    from: "/api-reference/event-triggers/delete-an-event-trigger",
    to: "/api/endpoints/event-triggers/deleteeventtrigger",
    status: 301,
  },
  {
    from: "/api-reference/event-triggers/update-an-event-trigger",
    to: "/api/endpoints/event-triggers/updateeventtrigger",
    status: 301,
  },
  {
    from: "/api-reference/chats/list-chats",
    to: "/api/endpoints/chats/listchats",
    status: 301,
  },
  {
    from: "/api-reference/chats/start-a-new-chat-and-stream-the-reply",
    to: "/api/endpoints/chats/createchat",
    status: 301,
  },
  {
    from: "/api-reference/chats/get-a-chat-by-external-channel-id",
    to: "/api/endpoints/chats/getchatbyexternalchannel",
    status: 301,
  },
  {
    from: "/api-reference/chats/get-a-single-chat-with-messages",
    to: "/api/endpoints/chats/getchat",
    status: 301,
  },
  {
    from: "/api-reference/chats/post-a-message-to-an-existing-chat-and-stream-the-reply",
    to: "/api/endpoints/chats/postchatmessage",
    status: 301,
  },
  {
    from: "/api-reference/skills/list-skills",
    to: "/api/endpoints/skills/listskills",
    status: 301,
  },
  {
    from: "/api-reference/skills/create-a-skill",
    to: "/api/endpoints/skills/createskill",
    status: 301,
  },
  {
    from: "/api-reference/skills/get-a-single-skill",
    to: "/api/endpoints/skills/getskill",
    status: 301,
  },
  {
    from: "/api-reference/skills/delete-a-skill",
    to: "/api/endpoints/skills/deleteskill",
    status: 301,
  },
  {
    from: "/api-reference/skills/update-a-skill",
    to: "/api/endpoints/skills/patchskill",
    status: 301,
  },
  {
    from: "/api-reference/feedback/submit-feedback-to-an-organizations-feedback-url",
    to: "/api/endpoints/feedback/submitorganizationfeedback",
    status: 301,
  },
  {
    from: "/api-reference/feedback/list-feedback",
    to: "/api/endpoints/feedback/listfeedback",
    status: 301,
  },
  {
    from: "/api-reference/feedback/submit-feedback-with-an-api-key",
    to: "/api/endpoints/feedback/submitfeedback",
    status: 301,
  },
  {
    from: "/api-reference/feedback/get-a-single-feedback-entry",
    to: "/api/endpoints/feedback/getfeedback",
    status: 301,
  },
  {
    from: "/api-reference/feedback/update-feedback-status",
    to: "/api/endpoints/feedback/updatefeedback",
    status: 301,
  },
  {
    from: "/api-reference/geo/list-geo-projects",
    to: "/api/endpoints/geo/listprojects",
    status: 301,
  },
  {
    from: "/api-reference/geo/create-a-geo-project",
    to: "/api/endpoints/geo/createproject",
    status: 301,
  },
  {
    from: "/api-reference/geo/get-a-single-geo-project",
    to: "/api/endpoints/geo/getproject",
    status: 301,
  },
  {
    from: "/api-reference/geo/delete-a-geo-project-and-all-of-its-geo-data",
    to: "/api/endpoints/geo/deleteproject",
    status: 301,
  },
  {
    from: "/api-reference/geo/rename-a-geo-project-or-relink-its-brand-identity",
    to: "/api/endpoints/geo/updateproject",
    status: 301,
  },
  {
    from: "/api-reference/geo/get-a-projects-geo-settings",
    to: "/api/endpoints/geo/getgeosettings",
    status: 301,
  },
  {
    from: "/api-reference/geo/replace-a-projects-geo-settings",
    to: "/api/endpoints/geo/updategeosettings",
    status: 301,
  },
  {
    from: "/api-reference/geo/list-tracked-geo-prompts",
    to: "/api/endpoints/geo/listgeoprompts",
    status: 301,
  },
  {
    from: "/api-reference/geo/track-a-new-geo-prompt",
    to: "/api/endpoints/geo/creategeoprompt",
    status: 301,
  },
  {
    from: "/api-reference/geo/stop-tracking-a-geo-prompt",
    to: "/api/endpoints/geo/deletegeoprompt",
    status: 301,
  },
  {
    from: "/api-reference/geo/enable-or-disable-a-tracked-geo-prompt",
    to: "/api/endpoints/geo/updategeoprompt",
    status: 301,
  },
  {
    from: "/api-reference/geo/bulk-import-geo-prompts",
    to: "/api/endpoints/geo/importgeoprompts",
    status: 301,
  },
  {
    from: "/api-reference/geo/list-geo-prompt-sequences",
    to: "/api/endpoints/geo/listgeosequences",
    status: 301,
  },
  {
    from: "/api-reference/geo/create-a-geo-prompt-sequence",
    to: "/api/endpoints/geo/creategeosequence",
    status: 301,
  },
  {
    from: "/api-reference/geo/delete-a-geo-prompt-sequence",
    to: "/api/endpoints/geo/deletegeosequence",
    status: 301,
  },
  {
    from: "/api-reference/geo/update-a-geo-prompt-sequence",
    to: "/api/endpoints/geo/updategeosequence",
    status: 301,
  },
  {
    from: "/api-reference/geo/run-a-geo-prompt-sequence-now",
    to: "/api/endpoints/geo/rungeosequence",
    status: 301,
  },
  {
    from: "/api-reference/geo/list-tracked-geo-competitors",
    to: "/api/endpoints/geo/listgeocompetitors",
    status: 301,
  },
  {
    from: "/api-reference/geo/create-or-update-a-tracked-geo-competitor",
    to: "/api/endpoints/geo/upsertgeocompetitor",
    status: 301,
  },
  {
    from: "/api-reference/geo/suggest-geo-competitors-for-a-domain",
    to: "/api/endpoints/geo/suggestgeocompetitors",
    status: 301,
  },
  {
    from: "/api-reference/geo/stop-tracking-a-geo-competitor",
    to: "/api/endpoints/geo/deletegeocompetitor",
    status: 301,
  },
  {
    from: "/api-reference/geo/bulk-import-geo-competitors",
    to: "/api/endpoints/geo/importgeocompetitors",
    status: 301,
  },
  {
    from: "/api-reference/geo/list-geo-scans",
    to: "/api/endpoints/geo/listgeoscans",
    status: 301,
  },
  {
    from: "/api-reference/geo/trigger-a-geo-scan",
    to: "/api/endpoints/geo/creategeoscan",
    status: 301,
  },
  {
    from: "/api-reference/geo/get-a-single-geo-scan",
    to: "/api/endpoints/geo/getgeoscan",
    status: 301,
  },
  {
    from: "/api-reference/geo/get-mention-rates-per-engine",
    to: "/api/endpoints/geo/getgeovisibilityoverview",
    status: 301,
  },
  {
    from: "/api-reference/geo/get-daily-mention-counts-per-engine",
    to: "/api/endpoints/geo/getgeovisibilitytimeseries",
    status: 301,
  },
  {
    from: "/api-reference/geo/get-the-latest-answer-per-prompt-and-engine",
    to: "/api/endpoints/geo/getgeovisibilitypromptresults",
    status: 301,
  },
  {
    from: "/api-reference/geo/get-share-of-voice-across-tracked-brands",
    to: "/api/endpoints/geo/getgeovisibilitycompetitorshare",
    status: 301,
  },
  {
    from: "/api-reference/geo/get-mention-rates-per-tracked-language",
    to: "/api/endpoints/geo/getgeovisibilitylanguageshare",
    status: 301,
  },
  {
    from: "/api-reference/geo/get-one-competitors-mention-history",
    to: "/api/endpoints/geo/getgeovisibilitycompetitordetail",
    status: 301,
  },
  {
    from: "/api-reference/geo/list-content-gaps",
    to: "/api/endpoints/geo/listgeocontentgaps",
    status: 301,
  },
  {
    from: "/api-reference/geo/list-content-briefs",
    to: "/api/endpoints/geo/listgeocontentbriefs",
    status: 301,
  },
  {
    from: "/api-reference/geo/plan-a-content-brief",
    to: "/api/endpoints/geo/plangeocontentbrief",
    status: 301,
  },
  {
    from: "/api-reference/geo/get-a-single-content-brief",
    to: "/api/endpoints/geo/getgeocontentbrief",
    status: 301,
  },
  {
    from: "/api-reference/geo/approve-a-brief-and-start-the-writer",
    to: "/api/endpoints/geo/approvegeocontentbrief",
    status: 301,
  },
  {
    from: "/api-reference/geo/get-the-latest-agent-readiness-report",
    to: "/api/endpoints/geo/getgeoagentreadiness",
    status: 301,
  },
  {
    from: "/api-reference/geo/start-an-agent-readiness-scan",
    to: "/api/endpoints/geo/startgeoagentreadinessscan",
    status: 301,
  },
  {
    from: "/api-reference/geo/get-ai-traffic-totals-and-sources",
    to: "/api/endpoints/geo/getgeotrafficoverview",
    status: 301,
  },
  {
    from: "/api-reference/geo/get-recent-ai-traffic-events",
    to: "/api/endpoints/geo/getgeotrafficlog",
    status: 301,
  },
  {
    from: "/api-reference/geo/list-ai-traffic-journeys",
    to: "/api/endpoints/geo/listgeotrafficjourneys",
    status: 301,
  },
  {
    from: "/api-reference/geo/get-one-journeys-events",
    to: "/api/endpoints/geo/getgeotrafficjourney",
    status: 301,
  },
  {
    from: "/api-reference/geo/list-the-most-visited-pages",
    to: "/api/endpoints/geo/listgeotrafficpages",
    status: 301,
  },
  {
    from: "/api-reference/geo/get-the-install-snippets",
    to: "/api/endpoints/geo/getgeoingestsetup",
    status: 301,
  },
  {
    from: "/api-reference/geo/issue-the-tracking-token",
    to: "/api/endpoints/geo/issuegeoingesttoken",
    status: 301,
  },
  {
    from: "/api-reference/geo/rotate-the-tracking-token",
    to: "/api/endpoints/geo/rotategeoingesttoken",
    status: 301,
  },
  {
    from: "/api-reference/agent/start-a-durable-agent-session",
    to: "/api/endpoints/agent/createagentsession",
    status: 301,
  },
  {
    from: "/api-reference/agent/send-a-follow-up-message-or-answer-a-pending-input-request",
    to: "/api/endpoints/agent/sendagentsessionmessage",
    status: 301,
  },
  {
    from: "/api-reference/agent/stream-an-agent-sessions-events",
    to: "/api/endpoints/agent/streamagentsessionevents",
    status: 301,
  },
  {
    from: "/api-reference/agent/list-agent-sessions",
    to: "/api/endpoints/agent/listagentchats",
    status: 301,
  },
] satisfies BlumeConfig["redirects"];
