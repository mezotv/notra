import { SLACK_FEATURES } from "@/constants/slack-integration";

export function SlackFeatureList() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {SLACK_FEATURES.map((feature) => (
        <div className="flex flex-col gap-2" key={feature.title}>
          <h2 className="font-sans font-semibold text-[#1E1E1E] text-lg leading-[1.4375rem] tracking-[-0.01em] dark:text-white">
            {feature.title}
          </h2>
          <p className="font-sans text-[#1E1E1EBF] text-sm leading-[1.3125rem] dark:text-white/75">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
}
