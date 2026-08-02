import type { CapabilityDescriptor } from "@notra/ai/schemas/autonomy/capability";

export const IRIS_CAPABILITY_VERSION = 1;

export const IRIS_CAPABILITY_SOURCE_GITHUB_READ = "source.github.read";
export const IRIS_CAPABILITY_CHANGELOG_CREATE = "content.changelog.create";
export const IRIS_CAPABILITY_BLOG_POST_CREATE = "content.blog-post.create";
export const IRIS_CAPABILITY_SOCIAL_POST_CREATE = "content.social-post.create";
export const IRIS_CAPABILITY_ANALYTICS_READ = "analytics.social.read";
export const IRIS_CAPABILITY_EXPERIMENT_CREATE = "analytics.experiment.create";
export const IRIS_CAPABILITY_EXPERIMENT_READ = "analytics.experiment.read";

export const IRIS_CONTENT_MAX_ATTEMPTS = 2;
export const IRIS_READ_MAX_ATTEMPTS = 3;

export const IRIS_MIN_IMAGES_PER_POST = 0;
export const IRIS_MAX_BLOG_POST_IMAGES = 2;
export const IRIS_MAX_CHANGELOG_IMAGES = 1;
export const IRIS_MAX_SOCIAL_POST_IMAGES = 1;
export const IRIS_IMAGE_QC_MAX_REVISION_ROUNDS = 1;
export const IRIS_IMAGE_PROMPT_MAX_LENGTH = 500;
export const IRIS_IMAGE_ARTICLE_CONTEXT_MAX_LENGTH = 500;
export const IRIS_IMAGE_DEFAULT_BRANCH = "main";

export const IRIS_ANALYTICS_DEFAULT_DAYS = 30;
export const IRIS_ANALYTICS_DEFAULT_TOP_POSTS = 5;
export const IRIS_ANALYTICS_CONTENT_EXCERPT_LENGTH = 200;
export const IRIS_ANALYTICS_BEST_WEEKDAY_COUNT = 3;

export const IRIS_EXPERIMENT_DEFAULT_METRIC = "engagement";
export const IRIS_EXPERIMENT_DEFAULT_PROVIDER = "twitter";
export const IRIS_EXPERIMENT_RUNNING_STATUS = "running";
export const IRIS_EXPERIMENT_DEFAULT_READ_LIMIT = 10;

export const IRIS_CAPABILITY_MAX_IMAGES: Record<string, number> = {
  [IRIS_CAPABILITY_SOURCE_GITHUB_READ]: IRIS_MIN_IMAGES_PER_POST,
  [IRIS_CAPABILITY_CHANGELOG_CREATE]: IRIS_MAX_CHANGELOG_IMAGES,
  [IRIS_CAPABILITY_BLOG_POST_CREATE]: IRIS_MAX_BLOG_POST_IMAGES,
  [IRIS_CAPABILITY_SOCIAL_POST_CREATE]: IRIS_MAX_SOCIAL_POST_IMAGES,
  [IRIS_CAPABILITY_ANALYTICS_READ]: IRIS_MIN_IMAGES_PER_POST,
  [IRIS_CAPABILITY_EXPERIMENT_CREATE]: IRIS_MIN_IMAGES_PER_POST,
  [IRIS_CAPABILITY_EXPERIMENT_READ]: IRIS_MIN_IMAGES_PER_POST,
};

export const IRIS_CAPABILITY_CATALOG: CapabilityDescriptor[] = [
  {
    name: IRIS_CAPABILITY_SOURCE_GITHUB_READ,
    version: IRIS_CAPABILITY_VERSION,
    description:
      "Read and normalize the connected GitHub context that arrived with the current signals (releases, pushes, tags) into a structured briefing other tasks can build on. Read only, makes no changes anywhere.",
    sideEffect: "read",
    idempotency: "natural",
    requiresVerification: false,
    maxAttempts: IRIS_READ_MAX_ATTEMPTS,
  },
  {
    name: IRIS_CAPABILITY_ANALYTICS_READ,
    version: IRIS_CAPABILITY_VERSION,
    description:
      "Read live social analytics for the workspace: per-account followers, impressions and engagement, the best performing posts, and which weekdays perform best. Use it to ground content strategy in real numbers. Read only, makes no changes anywhere.",
    sideEffect: "read",
    idempotency: "natural",
    requiresVerification: false,
    maxAttempts: IRIS_READ_MAX_ATTEMPTS,
  },
  {
    name: IRIS_CAPABILITY_EXPERIMENT_READ,
    version: IRIS_CAPABILITY_VERSION,
    description: `List the workspace's most recent A/B tests (up to ${IRIS_EXPERIMENT_DEFAULT_READ_LIMIT}) with their status, the metric under test, the declared winner, and the live value of each variant. Use it to see what is already being tested before proposing a new test. Read only, makes no changes anywhere.`,
    sideEffect: "read",
    idempotency: "natural",
    requiresVerification: false,
    maxAttempts: IRIS_READ_MAX_ATTEMPTS,
  },
  {
    name: IRIS_CAPABILITY_EXPERIMENT_CREATE,
    version: IRIS_CAPABILITY_VERSION,
    description: `Start an A/B test that compares two already published posts of the workspace on a single metric (${IRIS_EXPERIMENT_DEFAULT_METRIC}, impressions or likes) so you learn which content approach works. Take the two platform post ids from the topPosts returned by ${IRIS_CAPABILITY_ANALYTICS_READ}. The two variants must be different posts, and a test already running on the same pair is reused instead of duplicated. Takes no images.`,
    sideEffect: "write_internal",
    idempotency: "keyed",
    requiresVerification: true,
    maxAttempts: IRIS_CONTENT_MAX_ATTEMPTS,
  },
  {
    name: IRIS_CAPABILITY_CHANGELOG_CREATE,
    version: IRIS_CAPABILITY_VERSION,
    description:
      "Write a changelog entry covering the shipped changes in the current signals and save it as content in the workspace. Best for release notes and grouped shipped work. Takes no images.",
    sideEffect: "write_internal",
    idempotency: "keyed",
    requiresVerification: true,
    maxAttempts: IRIS_CONTENT_MAX_ATTEMPTS,
  },
  {
    name: IRIS_CAPABILITY_BLOG_POST_CREATE,
    version: IRIS_CAPABILITY_VERSION,
    description: `Write a narrative blog post about a launch or a major feature and save it as content in the workspace. Accepts an imageCount parameter between ${IRIS_MIN_IMAGES_PER_POST} and ${IRIS_MAX_BLOG_POST_IMAGES} for inline illustrations that are generated and quality checked before publishing.`,
    sideEffect: "write_internal",
    idempotency: "keyed",
    requiresVerification: true,
    maxAttempts: IRIS_CONTENT_MAX_ATTEMPTS,
  },
  {
    name: IRIS_CAPABILITY_SOCIAL_POST_CREATE,
    version: IRIS_CAPABILITY_VERSION,
    description:
      "Write a short social post for a single platform (twitter or linkedin, chosen with the platform parameter) about the current signals and save it as content in the workspace. Takes no images.",
    sideEffect: "write_internal",
    idempotency: "keyed",
    requiresVerification: true,
    maxAttempts: IRIS_CONTENT_MAX_ATTEMPTS,
  },
];

export const IRIS_CAPABILITY_NAMES = IRIS_CAPABILITY_CATALOG.map(
  (capability) => capability.name
);
