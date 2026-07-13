"use client";

import { EVE_AGENT_ORGANIZATION_HEADER } from "@notra/ai/constants/onboarding-agent";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@notra/ui/components/ai-elements/message";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import { Field, FieldLabel } from "@notra/ui/components/ui/field";
import { Input } from "@notra/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useEveAgent } from "eve/react";
import { Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BrailleLoader } from "@/components/braille-loader";
import { Button } from "@/components/button";
import { EveMessagePart } from "@/components/debug/eve-message-part";
import { NO_ORGANIZATION_VALUE } from "@/constants/debug";
import { authClient } from "@/lib/auth/client";
import { buildOnboardingAgentMessage } from "@/lib/debug/onboarding-agent";
import { useStreamWatchdog } from "@/lib/debug/use-stream-watchdog";
import { QUERY_KEYS } from "@/utils/query-keys";

export function OnboardingAgentStream() {
  const [domain, setDomain] = useState("");
  const [organizationId, setOrganizationId] = useState(NO_ORGANIZATION_VALUE);
  const organizationIdRef = useRef(NO_ORGANIZATION_VALUE);
  const agent = useEveAgent({
    headers: (): Record<string, string> => {
      const currentOrganizationId = organizationIdRef.current;
      return currentOrganizationId === NO_ORGANIZATION_VALUE
        ? {}
        : { [EVE_AGENT_ORGANIZATION_HEADER]: currentOrganizationId };
    },
    maxReconnectAttempts: 50,
    onError: (error) => toast.error(error.message),
  });
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { data: organizations } = useQuery({
    queryKey: QUERY_KEYS.AUTH.organizations,
    queryFn: async () => {
      const result = await authClient.organization.list();
      return result.data ?? [];
    },
  });

  const isBusy = agent.status === "submitted" || agent.status === "streaming";
  const messageCount = agent.data.messages.length;
  const isStreamStale = useStreamWatchdog(agent.events.length, isBusy);

  useEffect(() => {
    const element = scrollRef.current;
    if (element && agent.data.messages.length > 0) {
      element.scrollTop = element.scrollHeight;
    }
  }, [agent.data.messages.length]);

  const runAgent = async () => {
    if (agent.events.length > 0) {
      agent.reset();
    }
    try {
      await agent.send({
        message: buildOnboardingAgentMessage(
          domain.trim(),
          organizationId === NO_ORGANIZATION_VALUE ? undefined : organizationId
        ),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Agent run failed");
    }
  };

  const respondToInput = (requestId: string, optionId: string) => {
    agent.send({ inputResponses: [{ requestId, optionId }] }).catch((error) => {
      toast.error(error instanceof Error ? error.message : "Response failed");
    });
  };

  const canRun = domain.trim().length > 0 && !isBusy;

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Onboarding agent</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <Field className="flex-1">
            <FieldLabel htmlFor="agent-domain">Company domain</FieldLabel>
            <Input
              id="agent-domain"
              onChange={(event) => setDomain(event.target.value)}
              placeholder="stripe.com"
              value={domain}
            />
          </Field>
          <Field className="flex-1">
            <FieldLabel htmlFor="agent-org-id">Organization</FieldLabel>
            <Select
              disabled={isBusy}
              onValueChange={(value) => {
                const nextOrganizationId = value ?? NO_ORGANIZATION_VALUE;
                organizationIdRef.current = nextOrganizationId;
                setOrganizationId(nextOrganizationId);
              }}
              value={organizationId}
            >
              <SelectTrigger id="agent-org-id">
                <SelectValue placeholder="Select an organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ORGANIZATION_VALUE}>
                  None (research only)
                </SelectItem>
                {(organizations ?? []).map((organization) => (
                  <SelectItem key={organization.id} value={organization.id}>
                    {organization.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled={!canRun} onClick={runAgent}>
            {isBusy ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              "Run agent"
            )}
          </Button>
          {isBusy ? (
            <Button onClick={() => agent.stop()} variant="outline">
              Stop
            </Button>
          ) : null}
          {agent.session?.sessionId ? (
            <span className="font-mono text-muted-foreground text-xs">
              session: {agent.session.sessionId}
            </span>
          ) : null}
        </div>
        <div
          className="flex h-[32rem] flex-col gap-4 overflow-y-auto rounded-lg border bg-background p-4"
          ref={scrollRef}
        >
          {messageCount === 0 ? (
            <p className="m-auto text-muted-foreground text-sm">
              Run the agent to see the conversation here.
            </p>
          ) : null}
          {agent.data.messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.parts.map((part, index) => (
                  <EveMessagePart
                    key={`${message.id}-${index}`}
                    onRespond={respondToInput}
                    part={part}
                  />
                ))}
              </MessageContent>
            </Message>
          ))}
          {isBusy && !isStreamStale ? (
            <Message from="assistant">
              <MessageContent>
                <BrailleLoader className="text-sm" label="Working" />
              </MessageContent>
            </Message>
          ) : null}
          {isStreamStale ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-amber-600 text-sm dark:text-amber-400">
              No stream events for over 90 seconds. The connection likely
              dropped; the run may have finished server-side. Check the browser
              network panel for details.
            </div>
          ) : null}
        </div>
        {agent.events.length > 0 ? (
          <Collapsible>
            <CollapsibleTrigger className="text-muted-foreground text-xs underline-offset-2 hover:underline">
              Raw events ({agent.events.length})
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 max-h-[16rem] overflow-auto whitespace-pre-wrap break-all rounded-lg border bg-muted/50 p-3 font-mono text-muted-foreground text-xs">
                {agent.events.map((event) => JSON.stringify(event)).join("\n")}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </CardContent>
    </Card>
  );
}
