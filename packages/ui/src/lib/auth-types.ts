export type SocialProvider = "google" | "github";

export type AuthMethod = "email" | "google" | "github";

export interface PendingVerification {
  pendingAuthenticationToken: string;
  email: string;
}

export interface SignInWithPasswordInput {
  email: string;
  password: string;
  returnTo?: string | null;
}

export interface VerifyEmailCodeInput {
  pendingAuthenticationToken: string;
  code: string;
  returnTo?: string | null;
}

export interface StartSocialSignInInput {
  provider: string;
  returnTo?: string | null;
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

export interface AuthFormHeaderProps {
  title?: string;
  description?: string;
}

export interface AuthSocialButtonsProps {
  authMethod: AuthMethod | null;
  disabled: boolean;
  lastMethod?: string | null;
  onSelect: (provider: SocialProvider) => void;
}

export interface AuthFieldErrorProps {
  id: string;
  error?: string;
}

export interface AuthFormErrorProps {
  error: string | null;
  className?: string;
}

export interface AuthEmailFieldProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  disabled: boolean;
  placeholder: string;
  onBlur: () => void;
  onChange: (value: string) => void;
}

export interface AuthPasswordFieldProps {
  id: string;
  value: string;
  error?: string;
  disabled: boolean;
  placeholder: string;
  autoComplete: string;
  onBlur: () => void;
  onChange: (value: string) => void;
}

export interface EmailVerificationFormProps {
  pendingAuthenticationToken: string;
  email: string;
  returnTo?: string | null;
  onSuccess?: () => void;
  verifyEmailCode: (input: VerifyEmailCodeInput) => Promise<AuthFlowResult>;
}

export interface LoginFieldValidators {
  email: (value: string) => string | undefined;
  password: (value: string) => string | undefined;
}

export interface LoginFormProps {
  title?: string;
  description?: string;
  onSuccess?: () => void;
  returnTo?: string;
  showSignupLink?: boolean;
  showForgotPasswordLink?: boolean;
  initialError?: string;
  initialPendingVerification?: PendingVerification;
  callbackPath: string;
  validators: LoginFieldValidators;
  signInWithPassword: (
    input: SignInWithPasswordInput
  ) => Promise<AuthFlowResult>;
  verifyEmailCode: (input: VerifyEmailCodeInput) => Promise<AuthFlowResult>;
  startSocialSignIn: (input: StartSocialSignInInput) => Promise<void>;
}
