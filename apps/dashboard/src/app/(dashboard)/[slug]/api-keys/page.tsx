"use client";

import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  Book01Icon,
  Copy01Icon,
  Delete02Icon,
  Dots,
  Edit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ConnectedCards } from "@notra/ui/components/shared/connected-cards";
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
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@notra/ui/components/ui/field";
import { Input } from "@notra/ui/components/ui/input";
import { Kbd } from "@notra/ui/components/ui/kbd";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useForm } from "@tanstack/react-form";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  KeyResponseData,
  V2KeysCreateKeyResponseData,
} from "@unkey/api/models/components";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  API_KEY_EXPIRATION_OPTIONS,
  API_KEY_EXPIRATION_VALUES,
  API_KEY_PERMISSION_LABELS,
  API_KEY_PERMISSIONS,
} from "@/constants/api-keys";
import { API_KEY_CARD_ITEMS, API_KEY_PRESETS } from "@/lib/api-keys/presets";
import { dashboardOrpc } from "@/lib/orpc/query";
import { createApiKeySchema, updateApiKeySchema } from "@/schemas/api-keys";
import type { ApiKeyExpiration, ApiKeyPermission } from "@/types/api-keys";

const NEW_KEY_CONFIG_PARSERS = {
  name: parseAsString,
  permission: parseAsStringLiteral(API_KEY_PERMISSIONS),
  expiration: parseAsStringLiteral(API_KEY_EXPIRATION_VALUES),
};

const DEFAULT_NEW_KEY_CONFIG = {
  name: "",
  permission: "api.read" as ApiKeyPermission,
  expiration: "never" as ApiKeyExpiration,
};

type ApiKeyListItem = Omit<
  Pick<
    KeyResponseData,
    "keyId" | "name" | "start" | "createdAt" | "expires" | "enabled"
  >,
  "name" | "expires"
> & {
  name: string;
  expires: number | null;
  permission: string;
  permissions: string[];
  createdBy: string | null;
};

type CreateApiKeyResponse = V2KeysCreateKeyResponseData & {
  name: string;
};

interface ApiKeyMutationResponse {
  success: boolean;
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

function formatPermissionLabel(apiKey: ApiKeyListItem) {
  const hasRead = apiKey.permissions.includes("api.read");
  const hasWrite = apiKey.permissions.includes("api.write");

  if (hasRead && hasWrite) {
    return "Read & write";
  }

  if (hasWrite) {
    return "Read & write";
  }

  if (hasRead) {
    return "Read only";
  }

  return (
    API_KEY_PERMISSION_LABELS[apiKey.permission as ApiKeyPermission] ??
    apiKey.permission
  );
}

function getDefaultEditExpiration(
  createdAt: number,
  expires: number | null
): ApiKeyExpiration {
  if (expires === null) {
    return "never";
  }

  const ttl = Math.max(0, expires - createdAt);
  const day = 24 * 60 * 60 * 1000;

  if (ttl <= 7 * day) {
    return "7d";
  }

  if (ttl <= 30 * day) {
    return "30d";
  }

  if (ttl <= 60 * day) {
    return "60d";
  }

  return "90d";
}

function ApiKeysTableContent({
  isPending,
  keys,
  onDelete,
  onEdit,
  actionsDisabled,
}: {
  isPending: boolean;
  keys: ApiKeyListItem[];
  onDelete: (key: ApiKeyListItem) => void;
  onEdit: (key: ApiKeyListItem) => void;
  actionsDisabled: boolean;
}) {
  if (isPending) {
    return (
      <TableRow>
        <TableCell
          className="h-24 text-center text-muted-foreground"
          colSpan={6}
        >
          Loading…
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
        {apiKey.start}…
      </TableCell>
      <TableCell>{formatPermissionLabel(apiKey)}</TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatExpiry(apiKey.expires)}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {new Date(apiKey.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button size="icon" variant="ghost">
                <HugeiconsIcon className="size-4" icon={Dots} />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={actionsDisabled}
                onClick={() => onEdit(apiKey)}
              >
                <HugeiconsIcon className="size-4" icon={Edit02Icon} />
                Edit API key
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={actionsDisabled}
                onClick={() => onDelete(apiKey)}
                variant="destructive"
              >
                <HugeiconsIcon className="size-4" icon={Delete02Icon} />
                Delete API key
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
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
  const [createError, setCreateError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deletingKey, setDeletingKey] = useState<ApiKeyListItem | null>(null);
  const [newKeyConfig, setNewKeyConfig] = useQueryStates(
    NEW_KEY_CONFIG_PARSERS
  );
  const hasNewKeyConfig =
    newKeyConfig.name !== null &&
    newKeyConfig.permission !== null &&
    newKeyConfig.expiration !== null;

  useHotkey("C", () => setDialogOpen(true), {
    enabled: !(
      dialogOpen ||
      editDialogOpen ||
      !!deletingKey ||
      hasNewKeyConfig
    ),
  });

  const [createdSortOrder, setCreatedSortOrder] = useState<
    false | "asc" | "desc"
  >(false);

  const { data: keys = [], isPending } = useQuery<ApiKeyListItem[]>({
    ...dashboardOrpc.apiKeys.list.queryOptions({
      input: { organizationId: organizationId ?? "" },
    }),
    enabled: !!organizationId,
  });

  const sortedKeys = useMemo(() => {
    if (createdSortOrder === false) {
      return keys;
    }
    return [...keys].sort((a, b) => {
      return createdSortOrder === "desc"
        ? b.createdAt - a.createdAt
        : a.createdAt - b.createdAt;
    });
  }, [keys, createdSortOrder]);

  function getSortIcon(isSorted: false | "asc" | "desc") {
    if (isSorted === "asc") {
      return ArrowUp01Icon;
    }
    if (isSorted === "desc") {
      return ArrowDown01Icon;
    }
    return ArrowUpDownIcon;
  }
  const createdSortIcon = getSortIcon(createdSortOrder);

  const newKeyName = newKeyConfig.name;
  const newKeyPermission =
    newKeyConfig.permission ?? DEFAULT_NEW_KEY_CONFIG.permission;
  const newKeyExpiration =
    newKeyConfig.expiration ?? DEFAULT_NEW_KEY_CONFIG.expiration;
  const createInput = {
    name: newKeyName ?? DEFAULT_NEW_KEY_CONFIG.name,
    permission: newKeyPermission,
    expiration: newKeyExpiration,
  };

  useEffect(() => {
    if (hasNewKeyConfig) {
      setDialogOpen(true);
    }
  }, [hasNewKeyConfig]);

  const handlePresetSelect = (id: string) => {
    const preset = API_KEY_PRESETS.find((item) => item.id === id);
    if (!preset) {
      return;
    }
    const config = {
      name: preset.defaultName,
      permission: preset.permission,
      expiration: preset.expiration,
    };
    setCreateError(null);
    setDialogOpen(true);
    setNewKeyConfig(config);
  };

  const handleCreateSubmit = () => {
    const result = createApiKeySchema.safeParse(createInput);
    if (!result.success) {
      setCreateError(result.error.issues[0]?.message ?? "Invalid API key");
      return;
    }

    setCreateError(null);
    mutation.mutate(result.data);
  };

  const editForm = useForm({
    defaultValues: {
      keyId: "",
      name: "",
      permission: "api.read" as ApiKeyPermission,
      expiration: "never" as ApiKeyExpiration,
    },
    onSubmit: ({ value }) => {
      const result = updateApiKeySchema.safeParse(value);
      if (!result.success) {
        return;
      }
      editMutation.mutate(result.data);
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

      return dashboardOrpc.apiKeys.create.call({
        organizationId,
        ...values,
      }) as Promise<CreateApiKeyResponse>;
    },
    onSuccess: (data) => {
      setCreatedKey(data.key);
      setCreateError(null);
      setNewKeyConfig(null);
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.apiKeys.list.queryKey({
          input: { organizationId: organizationId ?? "" },
        }),
      });
      toast.success("API key created");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const editMutation = useMutation({
    mutationFn: async (values: {
      keyId: string;
      name: string;
      permission: ApiKeyPermission;
      expiration: ApiKeyExpiration;
    }) => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }

      return dashboardOrpc.apiKeys.update.call({
        organizationId,
        keyIdParam: values.keyId,
        payload: values,
      }) as Promise<ApiKeyMutationResponse>;
    },
    onSuccess: () => {
      setEditDialogOpen(false);
      editForm.reset();
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.apiKeys.list.queryKey({
          input: { organizationId: organizationId ?? "" },
        }),
      });
      toast.success("API key updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (keyId: string) => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }

      return dashboardOrpc.apiKeys.delete.call({
        organizationId,
        keyIdParam: keyId,
        payload: { keyId },
      }) as Promise<ApiKeyMutationResponse>;
    },
    onSuccess: () => {
      setDeletingKey(null);
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.apiKeys.list.queryKey({
          input: { organizationId: organizationId ?? "" },
        }),
      });
      toast.success("API key deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setCreateError(null);
      mutation.reset();
      setCreatedKey(null);
      setNewKeyConfig(null);
    }
    setDialogOpen(open);
  };

  const handleEditDialogClose = (open: boolean) => {
    if (!open) {
      if (editMutation.isPending) {
        return;
      }
      editForm.reset();
    }
    setEditDialogOpen(open);
  };

  const handleDeleteDialogClose = (open: boolean) => {
    if (!open && deleteMutation.isPending) {
      return;
    }

    if (!open) {
      setDeletingKey(null);
    }
  };

  const openEditDialog = (key: ApiKeyListItem) => {
    const permission = API_KEY_PERMISSIONS.includes(
      key.permission as ApiKeyPermission
    )
      ? (key.permission as ApiKeyPermission)
      : "api.read";

    editForm.reset({
      keyId: key.keyId,
      name: key.name,
      permission,
      expiration: getDefaultEditExpiration(key.createdAt, key.expires),
    });
    editForm.setFieldValue("name", key.name);
    setEditDialogOpen(true);
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
              Manage API keys for programmatic access to your organization
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button className="gap-1.5" onClick={() => setDialogOpen(true)}>
              <HugeiconsIcon className="size-4" icon={Add01Icon} />
              Create API Key
              <Kbd className="ml-1 hidden sm:inline-flex">C</Kbd>
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      onClick={() =>
                        window.open(
                          "https://docs.usenotra.com/api/getting-started",
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      size="icon"
                      variant="outline"
                    />
                  }
                >
                  <HugeiconsIcon className="size-4" icon={Book01Icon} />
                </TooltipTrigger>
                <TooltipContent>View API documentation</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border/80 border-b-border/40 bg-muted/80 shadow-2xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead className="w-35">Expires</TableHead>
                <TableHead className="w-35">
                  <Button
                    className="-ml-4"
                    onClick={() =>
                      setCreatedSortOrder(
                        createdSortOrder === "asc" ? "desc" : "asc"
                      )
                    }
                    variant="ghost"
                  >
                    Created At
                    <HugeiconsIcon
                      className="ml-2 size-4"
                      icon={createdSortIcon}
                    />
                  </Button>
                </TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <ApiKeysTableContent
                actionsDisabled={
                  editMutation.isPending || deleteMutation.isPending
                }
                isPending={isPending}
                keys={sortedKeys}
                onDelete={(key) => setDeletingKey(key)}
                onEdit={openEditDialog}
              />
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <h2 className="font-semibold text-lg tracking-tight">
              Quick start
            </h2>
            <p className="text-muted-foreground text-sm">
              Spin up a key preconfigured for how you plan to use the API.
            </p>
          </div>
          <ConnectedCards
            items={API_KEY_CARD_ITEMS}
            onSelect={handlePresetSelect}
          />
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
                  <HugeiconsIcon className="size-4" icon={Copy01Icon} />
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
                  handleCreateSubmit();
                }}
              >
                <div className="space-y-4 py-4">
                  <Field>
                    <FieldLabel>
                      Name<span className="-ml-1 text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      disabled={mutation.isPending}
                      onChange={(event) => {
                        setCreateError(null);
                        setNewKeyConfig({
                          name: event.target.value || null,
                        });
                      }}
                      placeholder="e.g. CI/CD Pipeline"
                      value={createInput.name}
                    />
                    {createError ? (
                      <p className="text-destructive text-sm">{createError}</p>
                    ) : null}
                  </Field>

                  <Field>
                    <FieldLabel>
                      Permission
                      <span className="-ml-1 text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      disabled={mutation.isPending}
                      onValueChange={(value) =>
                        setNewKeyConfig({
                          permission: value as ApiKeyPermission,
                        })
                      }
                      value={createInput.permission}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {API_KEY_PERMISSION_LABELS[createInput.permission]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="api.read">Read only</SelectItem>
                        <SelectItem value="api.write">Read & write</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

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
                        setNewKeyConfig({
                          expiration: value as ApiKeyExpiration,
                        })
                      }
                      value={createInput.expiration}
                    >
                      <SelectTrigger>
                        <SelectValue className="capitalize" />
                      </SelectTrigger>
                      <SelectContent>
                        {API_KEY_EXPIRATION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <ResponsiveAlertDialogFooter>
                  <ResponsiveAlertDialogCancel disabled={mutation.isPending}>
                    Cancel
                  </ResponsiveAlertDialogCancel>
                  <Button disabled={mutation.isPending} type="submit">
                    {mutation.isPending ? "Creating…" : "Create Key"}
                  </Button>
                </ResponsiveAlertDialogFooter>
              </form>
            </>
          )}
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>

      <ResponsiveDialog
        onOpenChange={handleEditDialogClose}
        open={editDialogOpen}
      >
        <ResponsiveDialogContent className="sm:max-w-120">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              editForm.handleSubmit();
            }}
          >
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle className="text-2xl">
                Edit API Key
              </ResponsiveDialogTitle>
            </ResponsiveDialogHeader>
            <div className="space-y-4 py-4">
              <editForm.Field
                name="name"
                validators={{
                  onChange: updateApiKeySchema.shape.name,
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel>
                      Name<span className="-ml-1 text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      autoFocus
                      disabled={editMutation.isPending}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onFocus={(e) => e.currentTarget.select()}
                      placeholder="e.g. CI/CD Pipeline"
                      value={field.state.value}
                    />
                    {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 ? (
                      <p className="text-destructive text-sm">
                        {typeof field.state.meta.errors[0] === "string"
                          ? field.state.meta.errors[0]
                          : ((
                              field.state.meta.errors[0] as { message?: string }
                            )?.message ?? "Invalid value")}
                      </p>
                    ) : null}
                  </Field>
                )}
              </editForm.Field>

              <editForm.Field name="permission">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      Permission
                      <span className="-ml-1 text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      disabled={editMutation.isPending}
                      onValueChange={(value) =>
                        field.handleChange(value as ApiKeyPermission)
                      }
                      value={field.state.value}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {API_KEY_PERMISSION_LABELS[field.state.value]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="api.read">Read only</SelectItem>
                        <SelectItem value="api.write">Read & write</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </editForm.Field>

              <editForm.Field name="expiration">
                {(field) => (
                  <Field>
                    <FieldLabel>Expiration</FieldLabel>
                    <Select
                      disabled={editMutation.isPending}
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
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </editForm.Field>
            </div>
            <ResponsiveDialogFooter>
              <ResponsiveDialogClose
                disabled={editMutation.isPending}
                render={<Button variant="outline">Cancel</Button>}
              />
              <Button disabled={editMutation.isPending} type="submit">
                {editMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </ResponsiveDialogFooter>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveAlertDialog
        onOpenChange={handleDeleteDialogClose}
        open={!!deletingKey}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              Delete API Key?
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              This will permanently delete
              {deletingKey ? ` ${deletingKey.name}` : " this API key"}. This
              action cannot be undone.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!deletingKey || deleteMutation.isPending}
              onClick={() => {
                if (!deletingKey) {
                  return;
                }
                deleteMutation.mutate(deletingKey.keyId);
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete API Key"}
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </PageContainer>
  );
}
