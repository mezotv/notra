import { parseAsStringLiteral, useQueryState } from "nuqs";

import { SETTINGS_QUERY_KEY, SETTINGS_SECTION_IDS } from "@/constants/settings";
import type { SettingsSectionId } from "@/types/settings/modal";

const settingsSectionParser = parseAsStringLiteral(
  SETTINGS_SECTION_IDS
).withOptions({
  history: "push",
  scroll: false,
});

export function useSettingsModal() {
  const [section, setSection] = useQueryState(
    SETTINGS_QUERY_KEY,
    settingsSectionParser
  );

  function openSettings(next: SettingsSectionId = "account") {
    setSection(next);
  }

  function closeSettings() {
    setSection(null);
  }

  return {
    section,
    isOpen: section !== null,
    setSection,
    openSettings,
    closeSettings,
  };
}
