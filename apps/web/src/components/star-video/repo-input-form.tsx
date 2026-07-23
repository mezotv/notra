"use client";

import { useQueryState } from "nuqs";
import { type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";
import { GitHubMark } from "@/components/star-video/github-mark";
import { parseRepoInput } from "@/lib/star-video/parse-repo";

const DEFAULT_INPUT = "usenotra/notra";

export function RepoInputForm() {
  const [repoParam, setRepoParam] = useQueryState("repo");
  const [value, setValue] = useState(repoParam ?? DEFAULT_INPUT);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const parsed = parseRepoInput(value);
      if (!parsed) {
        toast.error("Enter a repo as owner/name or a GitHub URL.");
        return;
      }
      setRepoParam(`${parsed.owner}/${parsed.repo}`.toLowerCase());
    },
    [setRepoParam, value]
  );

  return (
    <form className="w-full" onSubmit={onSubmit}>
      <div className="flex w-full max-w-[35rem] items-center justify-between gap-2.5 rounded-full bg-white py-2.5 pr-2.5 pl-5 [box-shadow:#ECECEC_0_0_0_0.0625rem,#28282814_0_0.0625rem_0.1875rem] dark:bg-white/[0.06] dark:[box-shadow:#FFFFFF1F_0_0_0_0.0625rem]">
        <div className="flex grow items-center gap-2.5">
          <GitHubMark className="size-4.5 shrink-0 text-[#1E1E1E80] dark:text-white/50" />
          <input
            aria-label="GitHub repository"
            className="w-full bg-transparent font-sans text-[#1E1E1E] text-[1rem] leading-[1.25] tracking-[-0.01em] outline-none placeholder:text-[#1E1E1E66] dark:text-white dark:placeholder:text-white/40"
            onChange={(event) => setValue(event.target.value)}
            placeholder="owner/name"
            value={value}
          />
        </div>
        <button
          className="cta-gradient-primary-flat flex shrink-0 cursor-pointer items-center justify-center rounded-full px-4.5 py-2 font-sans font-semibold text-[0.875rem] text-white leading-[1.29]"
          type="submit"
        >
          Generate
        </button>
      </div>
    </form>
  );
}
