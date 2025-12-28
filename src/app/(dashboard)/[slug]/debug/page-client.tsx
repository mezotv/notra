"use client";

import { useCallback, useState } from "react";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isValidGitHubUrl } from "@/utils/schemas/integrations";

type StreamStatus = "idle" | "streaming" | "complete" | "error";

function parseSSELine(line: string): string | null {
  const trimmedLine = line.trim();
  if (!trimmedLine?.startsWith("data:")) {
    return null;
  }

  const jsonStr = trimmedLine.slice(5).trim();
  if (jsonStr === "[DONE]") {
    return null;
  }

  try {
    const data = JSON.parse(jsonStr);
    if (data.type === "text-delta" && data.textDelta) {
      return data.textDelta;
    }
  } catch {
    // Skip invalid JSON
  }

  return null;
}

async function processStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onUpdate: (text: string) => void
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulatedText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const textDelta = parseSSELine(line);
      if (textDelta) {
        accumulatedText += textDelta;
        onUpdate(accumulatedText);
      }
    }
  }
}

export default function PageClient() {
  const [repoUrl, setRepoUrl] = useState("");
  const [releaseTag, setReleaseTag] = useState("");
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [error, setError] = useState("");

  const isLoading = status === "streaming";

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setResponse("");

      if (!isValidGitHubUrl(repoUrl)) {
        setError(
          "Invalid GitHub repository URL. Use: https://github.com/owner/repo, git@github.com:owner/repo, or owner/repo"
        );
        return;
      }

      setStatus("streaming");

      try {
        const prompt = releaseTag
          ? `Generate a changelog for ${repoUrl} with release tag ${releaseTag}`
          : `Generate a changelog for ${repoUrl}`;

        const res = await fetch("/api/workflows/ai/changelog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || "Failed to generate changelog");
        }

        if (!res.body) {
          throw new Error("No response body");
        }

        await processStream(res.body.getReader(), setResponse);
        setStatus("complete");
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setStatus("error");
      }
    },
    [repoUrl, releaseTag]
  );

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="font-bold text-3xl">Debug Agents</h1>
        <p className="mt-2 text-muted-foreground">
          Test and debug different AI agents in real-time
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Changelog Agent</CardTitle>
          <CardDescription>
            Generate changelogs from GitHub repositories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor="repoUrl">
                GitHub Repository URL
              </label>
              <Input
                disabled={isLoading}
                id="repoUrl"
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="owner/repo or https://github.com/owner/repo"
                required
                type="text"
                value={repoUrl}
              />
              <p className="text-muted-foreground text-xs">
                Supports: owner/repo, https://github.com/owner/repo, or
                git@github.com:owner/repo
              </p>
            </div>

            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor="releaseTag">
                Release Tag (optional)
              </label>
              <Input
                disabled={isLoading}
                id="releaseTag"
                onChange={(e) => setReleaseTag(e.target.value)}
                placeholder="v1.0.0"
                type="text"
                value={releaseTag}
              />
            </div>

            {error.length > 0 ? (
              <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                {error}
              </div>
            ) : null}

            <Button disabled={isLoading || repoUrl.length === 0} type="submit">
              {isLoading ? "Generating..." : "Generate Changelog"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {(response.length > 0 || isLoading) && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Changelog</CardTitle>
            <CardDescription>
              {isLoading
                ? "Generating changelog from repository data..."
                : "Changelog generated successfully"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {response.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <p className="text-sm">
                  Analyzing repository and generating changelog...
                </p>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <Streamdown isAnimating={isLoading} mode="streaming">
                  {response}
                </Streamdown>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
