export interface SignUpWithPasswordInput {
  email: string;
  password: string;
  name?: string;
  returnTo?: string | null;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}
