export interface SignupCreditsGrantInput {
  email: string;
  organizationId: string;
}

export interface SignupCreditsGrantResult {
  granted: boolean;
}
