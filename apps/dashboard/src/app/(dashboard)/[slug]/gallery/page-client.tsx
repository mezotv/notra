"use client";

import {
  Copy01Icon,
  Delete02Icon,
  HtmlFile01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@notra/ui/components/shared/responsive-alert-dialog";
import { Card } from "@notra/ui/components/ui/card";
import { cn } from "@notra/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { PageContainer } from "@/components/layout/container";
import { dashboardOrpc } from "@/lib/orpc/query";
import { combineDocumentsForFigma, copyHtmlToFigma } from "./copy-to-figma";
import { GalleryPageSkeleton } from "./skeleton";

interface HtmlDocument {
  id: string;
  name: string;
  content: string;
  size: number;
  createdAt: string | Date;
}

const HTML_ACCEPT = ".html,.htm,text/html";
const BYTES_PER_KB = 1024;

function formatBytes(bytes: number): string {
  if (bytes < BYTES_PER_KB) {
    return `${bytes} B`;
  }
  const kb = bytes / BYTES_PER_KB;
  if (kb < BYTES_PER_KB) {
    return `${kb.toFixed(1)} KB`;
  }
  return `${(kb / BYTES_PER_KB).toFixed(1)} MB`;
}

function isHtmlFile(file: File): boolean {
  return (
    file.type === "text/html" ||
    file.name.toLowerCase().endsWith(".html") ||
    file.name.toLowerCase().endsWith(".htm")
  );
}

function GalleryCard({
  document,
  onCopy,
  onDelete,
  isCopying,
}: {
  document: HtmlDocument;
  onCopy: (document: HtmlDocument) => void;
  onDelete: (document: HtmlDocument) => void;
  isCopying: boolean;
}) {
  const createdAt =
    document.createdAt instanceof Date
      ? document.createdAt
      : new Date(document.createdAt);

  return (
    <Card className="group flex h-full flex-col gap-0 overflow-hidden p-0">
      <div className="relative aspect-[4/3] w-full overflow-hidden border-border border-b bg-white">
        <iframe
          className="pointer-events-none h-[200%] w-[200%] origin-top-left scale-50 border-0"
          loading="lazy"
          sandbox=""
          srcDoc={document.content}
          title={document.name}
        />
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="space-y-1">
          <p className="truncate font-medium text-sm" title={document.name}>
            {document.name}
          </p>
          <p className="text-muted-foreground text-xs">
            {formatBytes(document.size)} ·{" "}
            {createdAt.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="flex-1"
            disabled={isCopying}
            onClick={() => onCopy(document)}
            size="sm"
            variant="outline"
          >
            {isCopying ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <HugeiconsIcon icon={Copy01Icon} size={16} />
            )}
            Copy to Figma
          </Button>
          <Button
            aria-label={`Delete ${document.name}`}
            onClick={() => onDelete(document)}
            size="sm"
            variant="ghost"
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function PageClient() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<HtmlDocument | null>(null);

  const listQueryOptions = dashboardOrpc.html.list.queryOptions();
  const { data, isLoading } = useQuery(listQueryOptions);
  const documents: HtmlDocument[] = data?.documents ?? [];

  const invalidate = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.html.list.key(),
      }),
    [queryClient]
  );

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      let uploaded = 0;
      for (const file of files) {
        const content = await file.text();
        if (content.trim().length === 0) {
          continue;
        }
        await dashboardOrpc.html.create.call({ name: file.name, content });
        uploaded += 1;
      }
      return uploaded;
    },
    onSuccess: async (uploaded) => {
      if (uploaded > 0) {
        toast.success(
          uploaded === 1 ? "HTML file added" : `${uploaded} HTML files added`
        );
        await invalidate();
      }
    },
    onError: () => {
      toast.error("Failed to upload HTML file");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await dashboardOrpc.html.deleteMany.call({ ids: [id] });
    },
    onSuccess: async () => {
      toast.success("HTML file deleted");
      await invalidate();
    },
    onError: () => {
      toast.error("Failed to delete HTML file");
    },
    onSettled: () => {
      setPendingDelete(null);
    },
  });

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) {
        return;
      }
      const htmlFiles = Array.from(fileList).filter(isHtmlFile);
      if (htmlFiles.length === 0) {
        toast.error("Please choose .html files");
        return;
      }
      uploadMutation.mutate(htmlFiles);
    },
    [uploadMutation]
  );

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleCopyOne = useCallback(async (document: HtmlDocument) => {
    setCopyingId(document.id);
    try {
      await copyHtmlToFigma(document.content);
      toast.success("Copied — paste into Figma");
    } catch {
      toast.error("Couldn't access the clipboard");
    } finally {
      setCopyingId(null);
    }
  }, []);

  const handleCopyAll = useCallback(async () => {
    if (documents.length === 0) {
      return;
    }
    try {
      await copyHtmlToFigma(combineDocumentsForFigma(documents));
      toast.success(`Copied ${documents.length} files — paste into Figma`);
    } catch {
      toast.error("Couldn't access the clipboard");
    }
  }, [documents]);

  if (isLoading) {
    return <GalleryPageSkeleton />;
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">HTML Gallery</h1>
            <p className="text-muted-foreground">
              Upload HTML files, preview them all in one place, and copy them
              straight into Figma.
            </p>
          </div>
          <Button
            disabled={documents.length === 0}
            onClick={handleCopyAll}
            variant="outline"
          >
            <HugeiconsIcon icon={Copy01Icon} size={16} />
            Copy all to Figma
          </Button>
        </div>

        <input
          accept={HTML_ACCEPT}
          className="hidden"
          multiple
          onChange={handleInputChange}
          ref={fileInputRef}
          type="file"
        />

        <button
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-card px-6 py-10 text-center transition-colors hover:border-foreground/30 hover:bg-accent/40",
            isDragging && "border-foreground/40 bg-accent/60"
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDrop={handleDrop}
          type="button"
        >
          {uploadMutation.isPending ? (
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          ) : (
            <HugeiconsIcon
              className="text-muted-foreground"
              icon={Upload01Icon}
              size={24}
            />
          )}
          <span className="font-medium text-sm">
            {uploadMutation.isPending
              ? "Uploading…"
              : "Drop HTML files here or click to browse"}
          </span>
          <span className="text-muted-foreground text-xs">
            .html files up to 5MB each
          </span>
        </button>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
            <HugeiconsIcon
              className="text-muted-foreground"
              icon={HtmlFile01Icon}
              size={28}
            />
            <p className="font-medium text-sm">No HTML files yet</p>
            <p className="text-muted-foreground text-xs">
              Upload your first HTML file to see it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((document) => (
              <GalleryCard
                document={document}
                isCopying={copyingId === document.id}
                key={document.id}
                onCopy={handleCopyOne}
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        )}
      </div>

      <ResponsiveAlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
        open={pendingDelete !== null}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              Delete this HTML file?
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              {pendingDelete?.name} will be permanently removed. This cannot be
              undone.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Cancel</ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) {
                  deleteMutation.mutate(pendingDelete.id);
                }
              }}
            >
              Delete
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </PageContainer>
  );
}
