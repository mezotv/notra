export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ArticleJsonLdInput {
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  type?: "Article" | "BlogPosting" | "TechArticle" | "NewsArticle";
}

export interface OfferLike {
  "@type": "Offer" | "AggregateOffer";
  name?: string;
  price?: string;
  priceCurrency?: string;
  priceSpecification?: unknown;
  url?: string;
  availability?: string;
  category?: string;
}

export interface ProductJsonLdInput {
  name: string;
  description: string;
  url: string;
  offers: OfferLike | OfferLike[];
}
