type MarbleWebhookEvent = `${string}.${string}`;

export interface MarbleWebhookPayload {
  event?: MarbleWebhookEvent;
  type?: MarbleWebhookEvent;
  data?: {
    id?: string;
    slug?: string;
    title?: string;
    userId?: string;
    name?: string;
    category?: string | { slug?: string };
    categorySlug?: string;
  };
}

export interface RevalidateMarbleContentOptions {
  category?: string;
  slug?: string;
}
