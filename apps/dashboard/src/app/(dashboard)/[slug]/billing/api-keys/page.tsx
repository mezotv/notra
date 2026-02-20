"use client";

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
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import { Field, FieldLabel } from "@notra/ui/components/ui/field";
import { Input } from "@notra/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  API_KEY_EXPIRATION_OPTIONS,
  type ApiKeyExpiration,
  type ApiKeyPermission,
  createApiKeySchema,
} from "@/schemas/api-keys";
import { QUERY_KEYS } from "@/utils/query-keys";

const PERMISSION_LABELS: Record<ApiKeyPermission, string> = {
  "api.read": "Read",
  "api.write": "Write",
};

interface ApiKeyListItem {
  keyId: string;
  name: string;
  start: string;
  createdAt: number;
  expires: number | null;
  enabled: boolean;
  permission: string;
  createdBy: string | null;
}

interface CreateApiKeyResponse {
  keyId: string;
  name: string;
  key: string;
}

function formatExpiry(expires: number | null) {
  if (!expires) {
    return "Never";
  }
  const date = new Date(expires);
  if (date.getTime() < Date.now()) {
    return "Expired";
  }
  return date.toLocaleDateString();
}

function ApiKeysTableContent({
  isPending,
  keys,
}: {
  isPending: boolean;
  keys: ApiKeyListItem[];
}) {
  if (isPending) {
    return (
      <TableRow>
        <TableCell
          className="h-24 text-center text-muted-foreground"
          colSpan={6}
        >
          Loading...
        </TableCell>
      </TableRow>
    );
  }

  if (keys.length === 0) {
    return (
      <TableRow>
        <TableCell
          className="h-24 text-center text-muted-foreground"
          colSpan={6}
        >
          No API keys yet
        </TableCell>
      </TableRow>
    );
  }

  return keys.map((apiKey) => (
    <TableRow key={apiKey.keyId}>
      <TableCell className="font-medium">{apiKey.name}</TableCell>
      <TableCell className="font-mono text-muted-foreground text-sm">
        {apiKey.start}...
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          {PERMISSION_LABELS[apiKey.permission as ApiKeyPermission] ??
            apiKey.permission}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatExpiry(apiKey.expires)}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {apiKey.createdBy ?? "Unknown"}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {new Date(apiKey.createdAt).toLocaleDateString()}
      </TableCell>
    </TableRow>
  ));
}

export default function ApiKeysPage() {
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const { data: keys = [], isPending } = useQuery<ApiKeyListItem[]>({
    queryKey: QUERY_KEYS.API_KEYS.list(organizationId ?? ""),
    queryFn: async () => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }
      const response = await fetch(
        `/api/organizations/${organizationId}/api-keys`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch API keys");
      }
      return (await response.json()) as ApiKeyListItem[];
    },
    enabled: !!organizationId,
  });

  const form = useForm({
    defaultValues: {
      name: "",
      permission: "api.read" as ApiKeyPermission,
      expiration: "never" as ApiKeyExpiration,
    },
    onSubmit: ({ value }) => {
      const result = createApiKeySchema.safeParse(value);
      if (!result.success) {
        return;
      }
      mutation.mutate(result.data);
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: {
      name: string;
      permission: ApiKeyPermission;
      expiration: ApiKeyExpiration;
    }) => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }
      const response = await fetch(
        `/api/organizations/${organizationId}/api-keys`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          (data as { error?: string }).error || "Failed to create API key"
        );
      }
      return data as CreateApiKeyResponse;
    },
    onSuccess: (data) => {
      setCreatedKey(data.key);
      form.reset();
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.API_KEYS.list(organizationId ?? ""),
      });
      toast.success("API key created");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      form.reset();
      mutation.reset();
      setCreatedKey(null);
    }
    setDialogOpen(open);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">API Keys</h1>
            <p className="text-muted-foreground">
              Manage API keys for programmatic access to your organization.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>Create API Key</Button>
        </div>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead className="w-35">Expires</TableHead>
                <TableHead className="w-35">Created By</TableHead>
                <TableHead className="w-35">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <ApiKeysTableContent isPending={isPending} keys={keys} />
            </TableBody>
          </Table>
        </div>
      </div>

      <ResponsiveAlertDialog onOpenChange={handleDialogClose} open={dialogOpen}>
        <ResponsiveAlertDialogContent className="sm:max-w-120">
          {createdKey ? (
            <>
              <ResponsiveAlertDialogHeader>
                <ResponsiveAlertDialogTitle>
                  API Key Created
                </ResponsiveAlertDialogTitle>
                <ResponsiveAlertDialogDescription>
                  Copy this key now. You won't be able to see it again.
                </ResponsiveAlertDialogDescription>
              </ResponsiveAlertDialogHeader>
              <div className="flex items-center gap-2">
                <Input readOnly value={createdKey} />
                <Button
                  onClick={() => copyToClipboard(createdKey)}
                  size="icon"
                  variant="outline"
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </div>
              <ResponsiveAlertDialogFooter>
                <ResponsiveAlertDialogAction
                  onClick={() => handleDialogClose(false)}
                >
                  Done
                </ResponsiveAlertDialogAction>
              </ResponsiveAlertDialogFooter>
            </>
          ) : (
            <>
              <ResponsiveAlertDialogHeader>
                <ResponsiveAlertDialogTitle className="text-2xl">
                  Create API Key
                </ResponsiveAlertDialogTitle>
                <ResponsiveAlertDialogDescription>
                  Create a new API key for your organization.
                </ResponsiveAlertDialogDescription>
              </ResponsiveAlertDialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
              >
                <div className="space-y-4 py-4">
                  <form.Field
                    name="name"
                    validators={{
                      onChange: createApiKeySchema.shape.name,
                    }}
                  >
                    {(field) => (
                      <Field>
                        <FieldLabel>
                          Name<span className="-ml-1 text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          disabled={mutation.isPending}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="e.g. CI/CD Pipeline"
                          value={field.state.value}
                        />
                        {field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0 ? (
                          <p className="text-destructive text-sm">
                            {typeof field.state.meta.errors[0] === "string"
                              ? field.state.meta.errors[0]
                              : ((
                                  field.state.meta.errors[0] as {
                                    message?: string;
                                  }
                                )?.message ?? "Invalid value")}
                          </p>
                        ) : null}
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="permission">
                    {(field) => (
                      <Field>
                        <FieldLabel>
                          Permission
                          <span className="-ml-1 text-destructive">*</span>
                        </FieldLabel>
                        <Select
                          disabled={mutation.isPending}
                          onValueChange={(value) =>
                            field.handleChange(value as ApiKeyPermission)
                          }
                          value={field.state.value}
                        >
                          <SelectTrigger>
                            <SelectValue>
                              {PERMISSION_LABELS[field.state.value]}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="api.read">Read only</SelectItem>
                            <SelectItem disabled value="api.write">
                              Write only (coming soon)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="expiration">
                    {(field) => (
                      <Field>
                        <FieldLabel>
                          Expiration
                          <span className="-ml-1 text-muted-foreground text-xs">
                            (Optional)
                          </span>
                        </FieldLabel>
                        <Select
                          disabled={mutation.isPending}
                          onValueChange={(value) =>
                            field.handleChange(value as ApiKeyExpiration)
                          }
                          value={field.state.value}
                        >
                          <SelectTrigger>
                            <SelectValue className="capitalize" />
                          </SelectTrigger>
                          <SelectContent>
                            {API_KEY_EXPIRATION_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  </form.Field>
                </div>
                <ResponsiveAlertDialogFooter>
                  <ResponsiveAlertDialogCancel disabled={mutation.isPending}>
                    Cancel
                  </ResponsiveAlertDialogCancel>
                  <form.Subscribe selector={(state) => [state.canSubmit]}>
                    {([canSubmit]) => (
                      <Button
                        disabled={!canSubmit || mutation.isPending}
                        onClick={(e) => {
                          e.preventDefault();
                          form.handleSubmit();
                        }}
                        type="button"
                      >
                        {mutation.isPending ? "Creating..." : "Create Key"}
                      </Button>
                    )}
                  </form.Subscribe>
                </ResponsiveAlertDialogFooter>
              </form>
            </>
          )}
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </PageContainer>
  );
}
