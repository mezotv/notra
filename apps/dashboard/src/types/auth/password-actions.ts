export interface SignInWithPasswordInput {
  email: string;
  password: string;
  returnTo?: string | null;
}

export interface SignUpWithPasswordInput {
  email: string;
  password: string;
  name?: string;
  returnTo?: string | null;
}

export interface VerifyEmailCodeInput {
  pendingAuthenticationToken: string;
  code: string;
  returnTo?: string | null;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface AuthFlowSuccess {
  status: "success";
  redirectTo: string;
}

export interface AuthFlowVerificationRequired {
  status: "verification-required";
  pendingAuthenticationToken: string;
  email: string;
}

export interface AuthFlowError {
  status: "error";
  message: string;
}

export type AuthFlowResult =
  | AuthFlowSuccess
  | AuthFlowVerificationRequired
  | AuthFlowError;
