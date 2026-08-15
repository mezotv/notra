export function SignupCreditsBanner() {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-[#f5f1ff] p-3 ring-1 ring-[#e4dafb]">
      <span className="flex size-[2.125rem] shrink-0 items-center justify-center rounded-[0.625rem] bg-[linear-gradient(160deg,#8b5cf6_0%,#6d28d9_100%)] font-semibold text-[0.9375rem] text-white">
        $5
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-[#3d2a73] text-[0.84375rem] leading-5">
          Get $5 in free credits with a company email
        </span>
        <span className="text-[#6b5a9e] text-[0.8125rem] leading-[1.1875rem]">
          Sign up with your work email and the credits are applied to your
          workspace automatically.
        </span>
      </div>
    </div>
  );
}
