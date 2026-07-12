"use client";

import { Button } from "@notra/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@notra/ui/components/ui/dialog";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { consoleOrpc } from "@/lib/orpc/query";
import {
  type CreateMcpServerRequest,
  createMcpServerRequestSchema,
  MAX_MCP_HEADERS,
  type TestMcpServerRequest,
  testMcpServerRequestSchema,
} from "@/schemas/integrations";

type AuthChoice = "none" | "bearer" | "headers";

interface HeaderRow {
  id: string;
  name: string;
  value: string;
}

function createHeaderRow(): HeaderRow {
  return {
    id: crypto.randomUUID(),
    name: "",
    value: "",
  };
}

export function AddMcpServerDialog({
  organizationId,
}: {
  organizationId: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [authChoice, setAuthChoice] = useState<AuthChoice>("none");
  const [bearerToken, setBearerToken] = useState("");
  const [headerRows, setHeaderRows] = useState<HeaderRow[]>([]);

  function reset() {
    setName("");
    setUrl("");
    setDescription("");
    setAuthChoice("none");
    setBearerToken("");
    setHeaderRows([]);
  }

  function buildHeaders() {
    if (authChoice === "bearer") {
      return bearerToken.trim()
        ? { Authorization: `Bearer ${bearerToken.trim()}` }
        : {};
    }
    if (authChoice === "headers") {
      const headers: Record<string, string> = {};
      for (const row of headerRows) {
        const headerName = row.name.trim();
        const headerValue = row.value.trim();
        if (headerName && headerValue) {
          headers[headerName] = headerValue;
        }
      }
      return headers;
    }
    return {};
  }

  function validateAuthentication() {
    if (authChoice === "bearer" && !bearerToken.trim()) {
      toast.error("Bearer token is required");
      return false;
    }
    if (
      authChoice === "headers" &&
      (headerRows.length === 0 ||
        headerRows.some((row) => !row.name.trim() || !row.value.trim()))
    ) {
      toast.error("Complete every custom header");
      return false;
    }
    return true;
  }

  function getCreateInput() {
    if (!validateAuthentication()) {
      return null;
    }

    const result = createMcpServerRequestSchema.safeParse({
      organizationId,
      name,
      url,
      description: description.trim() || null,
      authType: authChoice === "none" ? "none" : "headers",
      headers: buildHeaders(),
    });
    if (!result.success) {
      toast.error(
        result.error.issues[0]?.message ?? "Check the server details"
      );
      return null;
    }

    return result.data;
  }

  function getTestInput() {
    if (!validateAuthentication()) {
      return null;
    }

    const result = testMcpServerRequestSchema.safeParse({
      organizationId,
      url,
      headers: buildHeaders(),
    });
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Check the server URL");
      return null;
    }

    return result.data;
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateMcpServerRequest) =>
      consoleOrpc.integrations.mcp.create.call(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: consoleOrpc.integrations.list.queryKey({
          input: { organizationId },
        }),
      });
      toast.success("MCP server added");
      reset();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const testMutation = useMutation({
    mutationFn: (input: TestMcpServerRequest) =>
      consoleOrpc.integrations.mcp.test.call(input),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = getCreateInput();
    if (input) {
      createMutation.mutate(input);
    }
  }

  function updateHeader(id: string, field: "name" | "value", value: string) {
    setHeaderRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  }

  const isPending = createMutation.isPending || testMutation.isPending;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Add MCP server
      </Button>
      <Dialog
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isPending) {
            reset();
          }
          setOpen(nextOpen);
        }}
        open={open}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add MCP server</DialogTitle>
            <DialogDescription>
              Connect a Streamable HTTP MCP server to this organization.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="mcp-name">Name</Label>
              <Input
                disabled={isPending}
                id="mcp-name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Company tools"
                required
                value={name}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mcp-url">URL</Label>
              <Input
                disabled={isPending}
                id="mcp-url"
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://mcp.example.com"
                required
                type="url"
                value={url}
              />
              <p className="text-muted-foreground text-xs">
                HTTPS Streamable HTTP endpoints only.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mcp-description">Description</Label>
              <Textarea
                disabled={isPending}
                id="mcp-description"
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional context about this server"
                value={description}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mcp-auth-type">Authentication</Label>
              <select
                aria-label="Authentication"
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                disabled={isPending}
                id="mcp-auth-type"
                onChange={(event) => {
                  setAuthChoice(event.target.value as AuthChoice);
                  setBearerToken("");
                  setHeaderRows([]);
                }}
                value={authChoice}
              >
                <option value="none">None</option>
                <option value="bearer">Bearer token</option>
                <option value="headers">Custom headers</option>
              </select>
            </div>
            {authChoice === "bearer" ? (
              <div className="grid gap-2">
                <Label htmlFor="mcp-bearer-token">Bearer token</Label>
                <Input
                  autoComplete="off"
                  disabled={isPending}
                  id="mcp-bearer-token"
                  onChange={(event) => setBearerToken(event.target.value)}
                  placeholder="Token"
                  type="password"
                  value={bearerToken}
                />
              </div>
            ) : null}
            {authChoice === "headers" ? (
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label>Custom headers</Label>
                  <Button
                    disabled={isPending || headerRows.length >= MAX_MCP_HEADERS}
                    onClick={() =>
                      setHeaderRows((rows) => [...rows, createHeaderRow()])
                    }
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Plus />
                    Add header
                  </Button>
                </div>
                {headerRows.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-3 text-muted-foreground text-sm">
                    Add at least one authentication header.
                  </p>
                ) : null}
                {headerRows.map((row) => (
                  <div className="flex items-center gap-2" key={row.id}>
                    <Input
                      aria-label="Header name"
                      disabled={isPending}
                      onChange={(event) =>
                        updateHeader(row.id, "name", event.target.value)
                      }
                      placeholder="Header name"
                      value={row.name}
                    />
                    <Input
                      aria-label="Header value"
                      disabled={isPending}
                      onChange={(event) =>
                        updateHeader(row.id, "value", event.target.value)
                      }
                      placeholder="Value"
                      type="password"
                      value={row.value}
                    />
                    <Button
                      aria-label="Remove header"
                      disabled={isPending}
                      onClick={() =>
                        setHeaderRows((rows) =>
                          rows.filter((item) => item.id !== row.id)
                        )
                      }
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
            <DialogFooter className="mt-2">
              <Button
                disabled={isPending}
                onClick={() => setOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={isPending}
                onClick={() => {
                  const input = getTestInput();
                  if (input) {
                    testMutation.mutate(input);
                  }
                }}
                type="button"
                variant="outline"
              >
                {testMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : null}
                Test connection
              </Button>
              <Button disabled={isPending} type="submit">
                {createMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : null}
                Add server
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
