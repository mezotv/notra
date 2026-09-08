import { redirect } from "next/navigation";

import { BILLING_SETTINGS_SEARCH_KEYS } from "@/constants/settings";
import type { SettingsUrlSearchParams } from "@/types/settings/modal";
import {
  settingsPath,
  settingsQueryFromSearchParams,
} from "@/utils/settings-path";

export const instant = true;

export default async function SettingsBillingRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SettingsUrlSearchParams>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  redirect(
    settingsPath(
      slug,
      "billing",
      settingsQueryFromSearchParams(query, BILLING_SETTINGS_SEARCH_KEYS)
    )
  );
}
