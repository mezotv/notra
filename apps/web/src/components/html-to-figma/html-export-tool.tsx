"use client";

import { EyeIcon, SourceCodeIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { ExpandableTabs } from "@notra/ui/components/ui/expandable-tabs";
import { Figma } from "@notra/ui/components/ui/svgs/figma";
import { Paper } from "@notra/ui/components/ui/svgs/paper";
import { useState } from "react";
import { toast } from "sonner";
import HtmlCodeEditor from "@/components/html-to-figma/html-code-editor";
import HtmlPreview from "@/components/html-to-figma/html-preview";
import {
  HTML_EXPORT_COPY,
  HTML_EXPORT_LABEL,
  HTML_EXPORT_PLACEHOLDER,
} from "@/lib/html-to-figma/constants";
import { copyHtmlAsFigma, copyHtmlAsPaper } from "@/lib/html-to-figma/export";
import type { HtmlExportToolProps } from "@/types/html-to-figma";

const PANEL_CLASS =
  "h-[60vh] max-h-[44rem] min-h-[24rem] w-full overflow-hidden rounded-xl border border-border bg-muted/30";

export default function HtmlExportTool({ target }: HtmlExportToolProps) {
  const [html, setHtml] = useState("");
  const [pending, setPending] = useState(false);
  const [view, setView] = useState("html");

  const copy = HTML_EXPORT_COPY[target];
  const isEmpty = html.trim().length === 0;

  const tabs = [
    {
      value: "html",
      label: "HTML",
      icon: <HugeiconsIcon className="size-5" icon={SourceCodeIcon} />,
    },
    {
      value: "preview",
      label: "Preview",
      icon: <HugeiconsIcon className="size-5" icon={EyeIcon} />,
    },
  ];

  async function handleCopy() {
    if (pending || isEmpty) {
      return;
    }

    setPending(true);

    const result =
      target === "figma"
        ? await copyHtmlAsFigma(html, HTML_EXPORT_LABEL)
        : await copyHtmlAsPaper(html, HTML_EXPORT_LABEL);

    setPending(false);

    if (result.copied) {
      toast.success(copy.successMessage);
      return;
    }

    toast.error(result.error ?? copy.errorMessage);
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <ExpandableTabs
          items={tabs}
          label="Switch between HTML and preview"
          onValueChange={setView}
          value={view}
        />

        <Button
          className="gap-2 border border-border bg-white text-neutral-900 shadow-sm hover:bg-neutral-50"
          disabled={isEmpty || pending}
          onClick={handleCopy}
          size="lg"
          type="button"
          variant="outline"
        >
          {target === "figma" ? (
            <Figma className="size-4" />
          ) : (
            <Paper className="size-4" />
          )}
          {pending ? copy.pendingLabel : copy.buttonLabel}
        </Button>
      </div>

      {view === "preview" ? (
        <div className={PANEL_CLASS}>
          <HtmlPreview html={html} />
        </div>
      ) : (
        <HtmlCodeEditor
          onChange={setHtml}
          placeholder={HTML_EXPORT_PLACEHOLDER}
          value={html}
        />
      )}

      <p className="font-mono text-muted-foreground text-xs">
        Runs in your browser. Nothing is uploaded.
      </p>
    </div>
  );
}
