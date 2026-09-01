"use client";

import {
  GEO_BRAND_SEARCH_DEBOUNCE_MS,
  GEO_BRAND_SEARCH_MAX_QUERY_LENGTH,
  GEO_BRAND_SEARCH_MIN_QUERY_LENGTH,
} from "@notra/geo-core/constants/geo";
import type { GeoBrandSearchResult } from "@notra/geo-core/types/geo";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@notra/ui/components/ui/combobox";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";

import { CompetitorBrandLogo } from "@/components/onboarding/competitor-brand-logo";
import { useGeoBrandSearch } from "@/lib/hooks/use-geo";
import type { CompetitorSearchProps } from "@/types/onboarding";
import { findCompetitor } from "@/utils/onboarding-competitors";

export function CompetitorSearch({
  organizationId,
  ownDomain,
  selected,
  disabled,
  onAdd,
}: CompetitorSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(query, {
    wait: GEO_BRAND_SEARCH_DEBOUNCE_MS,
  });
  const search = useGeoBrandSearch(organizationId, debouncedQuery);
  const trimmed = query.trim();
  const active = trimmed.length >= GEO_BRAND_SEARCH_MIN_QUERY_LENGTH;
  const searching = active && (search.isFetching || query !== debouncedQuery);
  const results = (search.data?.results ?? []).filter(
    (entry) =>
      entry.domain !== ownDomain &&
      !findCompetitor(selected, entry.domain, entry.name)
  );

  return (
    <Combobox<GeoBrandSearchResult | null>
      disabled={disabled}
      filter={null}
      inputValue={query}
      items={results}
      itemToStringLabel={(item) => item?.name ?? ""}
      onInputValueChange={(value) => setQuery(value)}
      onValueChange={(item) => {
        if (item) {
          onAdd(item);
        }
        setQuery("");
      }}
      value={null}
    >
      <ComboboxInput
        aria-label="Search brands"
        className="h-11 rounded-xl"
        maxLength={GEO_BRAND_SEARCH_MAX_QUERY_LENGTH}
        placeholder="Type a name or domain"
        showTrigger={false}
      >
        {searching ? (
          <span className="text-muted-foreground flex items-center pr-3">
            <Loader2Icon className="size-4 animate-spin" />
          </span>
        ) : null}
      </ComboboxInput>
      {active ? (
        <ComboboxContent>
          <ComboboxEmpty>
            {searching ? "Looking" : "Nothing found"}
          </ComboboxEmpty>
          <ComboboxList>
            {results.map((entry) => (
              <ComboboxItem key={entry.domain} value={entry}>
                <span className="flex min-w-0 items-center gap-2.5">
                  <CompetitorBrandLogo
                    className="size-6 rounded-md"
                    domain={entry.domain}
                    logo={entry.logo}
                    name={entry.name}
                  />
                  <span className="truncate font-medium">{entry.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {entry.domain}
                  </span>
                </span>
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      ) : null}
    </Combobox>
  );
}
