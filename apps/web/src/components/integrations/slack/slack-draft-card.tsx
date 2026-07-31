import Image from "next/image";
import {
  SLACK_DRAFT_ACTION_LABEL,
  SLACK_DRAFT_BODY,
  SLACK_DRAFT_HEADLINE,
  SLACK_DRAFT_META,
  SLACK_DRAFT_TITLE,
} from "@/constants/slack-integration";

export function SlackDraftCard() {
  return (
    <div className="flex w-full grow basis-0 flex-col overflow-clip rounded-[1.25rem] bg-white [box-shadow:#ECECEC_0_0_0_0.0625rem,#28282820_0_0.5rem_1.5rem_-0.5rem] lg:w-auto dark:bg-[#17131F] dark:[box-shadow:#FFFFFF14_0_0_0_0.0625rem]">
      <div className="flex items-center justify-between px-5 py-3.5 [box-shadow:#F0F0F0_0_-0.0625rem_0_inset] dark:[box-shadow:#FFFFFF14_0_-0.0625rem_0_inset]">
        <div className="flex items-center gap-2">
          <Image
            alt="Notra logo"
            className="size-4.5 shrink-0"
            height={18}
            src="/notra-mark.svg"
            width={18}
          />
          <span className="font-sans font-semibold text-[#1E1E1E] text-sm leading-[1.125rem] dark:text-white">
            {SLACK_DRAFT_TITLE}
          </span>
        </div>
        <span className="cta-gradient-primary-flat flex items-center rounded-full px-3.5 py-1.25 font-sans font-semibold text-white text-xs leading-4">
          {SLACK_DRAFT_ACTION_LABEL}
        </span>
      </div>
      <div className="flex flex-col gap-2 px-5 pt-4 pb-5">
        <span className="font-sans font-semibold text-[#1E1E1E] text-base leading-[1.3125rem] tracking-[-0.01em] dark:text-white">
          {SLACK_DRAFT_HEADLINE}
        </span>
        <p className="font-sans text-[#1E1E1EBF] text-[0.8125rem] leading-5 dark:text-white/75">
          {SLACK_DRAFT_BODY}
        </p>
        <span className="font-medium font-sans text-[#1E1E1E80] text-xs leading-4 dark:text-white/50">
          {SLACK_DRAFT_META}
        </span>
      </div>
    </div>
  );
}
