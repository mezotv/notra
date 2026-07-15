export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

export interface User {
  name: string;
  email: string;
  image?: string | null;
}
