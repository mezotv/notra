export type NavbarVariant = "island" | "landing" | "pinned" | "static";

export interface NavbarProps {
  variant?: NavbarVariant;
}

export interface NavbarAuthActionsProps {
  isAuthenticated: boolean;
}

export interface NavbarKbdProps {
  children: string;
  onLight?: boolean;
}
