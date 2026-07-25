"use client";

import { useQueryState } from "nuqs";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { GitHubMark } from "@/components/star-video/github-mark";
import { parseRepoInput } from "@/lib/star-video/parse-repo";

const DEFAULT_INPUT = "usenotra/notra";

export function RepoInputForm() {
  const [repoParam, setRepoParam] = useQueryState("repo");
  const [value, setValue] = useState(repoParam ?? DEFAULT_INPUT);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseRepoInput(value);
    if (!parsed) {
      toast.error("Enter a repo as owner/name or a GitHub URL.");
      return;
    }
    setRepoParam(`${parsed.owner}/${parsed.repo}`.toLowerCase());
  };

  return (
    <form
      className="flex w-full max-w-[35rem] flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-2.5 sm:rounded-full sm:bg-white sm:py-2.5 sm:pr-2.5 sm:pl-5 dark:sm:bg-white/[0.06] sm:[box-shadow:#ECECEC_0_0_0_0.0625rem,#28282814_0_0.0625rem_0.1875rem] dark:sm:[box-shadow:#FFFFFF1F_0_0_0_0.0625rem]"
      onSubmit={onSubmit}
    >
      <div className="flex min-w-0 grow items-center gap-2.5 rounded-full bg-white px-5 py-3 [box-shadow:#ECECEC_0_0_0_0.0625rem,#28282814_0_0.0625rem_0.1875rem] sm:bg-transparent sm:p-0 dark:bg-white/[0.06] dark:sm:bg-transparent sm:[box-shadow:none] dark:[box-shadow:#FFFFFF1F_0_0_0_0.0625rem] dark:sm:[box-shadow:none]">
        <GitHubMark className="size-4.5 shrink-0 text-[#1E1E1E80] dark:text-white/50" />
        <input
          aria-label="GitHub repository"
          className="w-full min-w-0 bg-transparent font-sans text-[#1E1E1E] text-[1rem] leading-[1.25] tracking-[-0.01em] outline-none placeholder:text-[#1E1E1E66] dark:text-white dark:placeholder:text-white/40"
          onChange={(event) => setValue(event.target.value)}
          placeholder="owner/name"
          value={value}
        />
      </div>
      <button
        className="cta-gradient-primary-flat flex shrink-0 cursor-pointer items-center justify-center rounded-full px-5 py-3 font-sans font-semibold text-[0.9375rem] text-white leading-[1.29] sm:px-4.5 sm:py-2 sm:text-[0.875rem]"
        type="submit"
      >
        Generate video
      </button>
    </form>
  );
}
