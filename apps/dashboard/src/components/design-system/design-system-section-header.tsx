import { DESIGN_SYSTEM_CATALOG_BY_ID } from "@/constants/design-system-catalog";

export function DesignSystemSectionHeader({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description?: string;
}) {
  const item = DESIGN_SYSTEM_CATALOG_BY_ID[id];

  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold tracking-tight">
        {item ? (
          <span className="text-muted-foreground mr-3 font-mono text-xs tabular-nums">
            {item.number}
          </span>
        ) : null}
        {title}
      </h2>
      {description ? (
        <p className="text-muted-foreground text-sm">{description}</p>
      ) : null}
    </div>
  );
}
