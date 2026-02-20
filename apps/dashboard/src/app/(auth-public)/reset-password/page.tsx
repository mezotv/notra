import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-w-[300px] flex-col gap-8 rounded-md p-6 lg:w-[384px] lg:px-8 lg:py-10">
          <div className="text-center">
            <h1 className="font-semibold text-xl lg:text-2xl">Loading…</h1>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
