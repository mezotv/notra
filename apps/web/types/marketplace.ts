export interface MarketplaceReference {
  id: string;
  type: "twitter_post" | "linkedin_post" | "blog_post" | "custom";
  content: string;
  metadata: Record<string, unknown> | null;
  note: string | null;
  applicableTo: ("all" | "twitter" | "linkedin" | "blog")[];
}

export interface MarketplaceBrand {
  id: string;
  slug: string;
  companyName: string;
  companyDescription: string | null;
  websiteUrl: string;
  logoUrl: string | null;
  accentColor: string | null;
  toneProfile: string | null;
  customTone: string | null;
  audience: string | null;
  language: string | null;
  customInstructions: string | null;
  category: string;
  featured: boolean;
  references: MarketplaceReference[];
  referenceCount: number;
  createdAt: string;
}

export interface MarketplaceBrandListProps {
  brands: MarketplaceBrand[];
}

export interface MarketplaceBrandDetailProps {
  brand: MarketplaceBrand;
}

export interface MarketplaceReferenceCardProps {
  reference: MarketplaceReference;
}

export interface MarketplaceBrowsePageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}
