"use client";

import { useFlag } from "@databuddy/sdk/react";

import { SOCIAL_ANALYTICS_FLAG_KEY } from "@/constants/analytics";
import { IRIS_FLAG_KEY } from "@/constants/iris";
import type { NavVisibility } from "@/types/components/nav";
import { isAnalyticsVisibleInNav } from "@/utils/analytics-flag";
import { isIrisVisibleInNav } from "@/utils/iris-flag";

export function useNavVisibility(): NavVisibility {
  const irisFlag = useFlag(IRIS_FLAG_KEY);
  const analyticsFlag = useFlag(SOCIAL_ANALYTICS_FLAG_KEY);

  return {
    iris: isIrisVisibleInNav(irisFlag.on),
    analytics: isAnalyticsVisibleInNav(analyticsFlag.on),
  };
}
