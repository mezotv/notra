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
      <h2 className="font-semibold text-xl tracking-tight">
        {item ? (
          <span className="mr-3 font-mono text-muted-foreground text-xs tabular-nums">
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
