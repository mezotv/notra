"use client";

import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Label } from "@notra/ui/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@notra/ui/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { useId } from "react";

import { Button } from "@/components/button";
import { Calendar } from "@/components/calendar";
import { ShelfMemberSelect } from "@/components/geo/shelf/shelf-member-select";
import { ShelfTicketBadge } from "@/components/geo/shelf/shelf-ticket-badge";
import {
  GEO_SHELF_NO_PRIORITY,
  GEO_SHELF_NOTES_MAX_LENGTH,
  GEO_SHELF_OPPORTUNITY_STATUSES,
  GEO_SHELF_PRIORITIES,
  GEO_SHELF_PRIORITY_LABELS,
} from "@/constants/geo-shelf";
import type {
  GeoShelfOpportunityStatus,
  GeoShelfPriority,
  GeoShelfTicketFormProps,
} from "@/types/geo-shelf";
import { formatShelfDueDate, shelfDueDateToIso } from "@/utils/geo-shelf";

function toStatus(value: string): GeoShelfOpportunityStatus {
  return (
    GEO_SHELF_OPPORTUNITY_STATUSES.find((status) => status === value) ?? "open"
  );
}

function toPriority(value: string): GeoShelfPriority | null {
  return GEO_SHELF_PRIORITIES.find((priority) => priority === value) ?? null;
}

export function ShelfTicketForm({
  opportunity,
  members,
  currentMemberId,
  onChange,
  disabled,
}: GeoShelfTicketFormProps) {
  const id = useId();
  const status = opportunity?.status ?? "open";
  const priority = opportunity?.priority ?? null;
  const assigneeMemberId = opportunity?.assigneeMemberId ?? null;
  const pocMemberId = opportunity?.pocMemberId ?? null;
  const notes = opportunity?.notes ?? "";
  const dueAt = opportunity?.dueAt ?? null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-status`}>Status</Label>
        <Select
          disabled={disabled}
          onValueChange={(value) =>
            onChange({ status: toStatus(value ?? "open") })
          }
          value={status}
        >
          <SelectTrigger className="w-full" id={`${id}-status`}>
            <SelectValue>
              <ShelfTicketBadge status={status} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {GEO_SHELF_OPPORTUNITY_STATUSES.map((option) => (
              <SelectItem key={option} value={option}>
                <ShelfTicketBadge status={option} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-priority`}>Priority</Label>
        <Select
          disabled={disabled}
          onValueChange={(value) =>
            onChange({ priority: toPriority(value ?? GEO_SHELF_NO_PRIORITY) })
          }
          value={priority ?? GEO_SHELF_NO_PRIORITY}
        >
          <SelectTrigger className="w-full" id={`${id}-priority`}>
            <SelectValue>
              {priority ? GEO_SHELF_PRIORITY_LABELS[priority] : "No priority"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={GEO_SHELF_NO_PRIORITY}>No priority</SelectItem>
            {GEO_SHELF_PRIORITIES.map((option) => (
              <SelectItem key={option} value={option}>
                {GEO_SHELF_PRIORITY_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <span className="flex items-center justify-between">
          <Label htmlFor={`${id}-assignee`}>Assignee</Label>
          {currentMemberId && assigneeMemberId !== currentMemberId ? (
            <button
              className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
              disabled={disabled}
              onClick={() => onChange({ assigneeMemberId: currentMemberId })}
              type="button"
            >
              Assign to me
            </button>
          ) : null}
        </span>
        <ShelfMemberSelect
          ariaLabel="Assignee"
          disabled={disabled}
          id={`${id}-assignee`}
          members={members}
          onChange={(memberId) => onChange({ assigneeMemberId: memberId })}
          value={assigneeMemberId}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-poc`}>Point of contact</Label>
        <ShelfMemberSelect
          allowSameAsAssignee
          ariaLabel="Point of contact"
          disabled={disabled}
          id={`${id}-poc`}
          members={members}
          onChange={(memberId) => onChange({ pocMemberId: memberId })}
          value={pocMemberId}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-due`}>Due</Label>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                className="w-full justify-start gap-2 font-normal"
                disabled={disabled}
                id={`${id}-due`}
                variant="outline"
              />
            }
          >
            <HugeiconsIcon
              className="text-muted-foreground size-4"
              icon={Calendar03Icon}
            />
            {dueAt ? (
              formatShelfDueDate(dueAt)
            ) : (
              <span className="text-muted-foreground">Pick a date</span>
            )}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto overflow-hidden p-0">
            <Calendar
              defaultMonth={dueAt ? new Date(dueAt) : undefined}
              disabled={disabled ? () => true : undefined}
              mode="single"
              onSelect={(date) => {
                if (!disabled) {
                  onChange({ dueAt: date ? shelfDueDateToIso(date) : null });
                }
              }}
              selected={dueAt ? new Date(dueAt) : undefined}
            />
            {dueAt ? (
              <div className="flex justify-end border-t p-2">
                <Button
                  disabled={disabled}
                  onClick={() => {
                    if (!disabled) {
                      onChange({ dueAt: null });
                    }
                  }}
                  size="sm"
                  variant="ghost"
                >
                  Clear due date
                </Button>
              </div>
            ) : null}
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={`${id}-notes`}>Notes</Label>
        <Textarea
          disabled={disabled}
          id={`${id}-notes`}
          maxLength={GEO_SHELF_NOTES_MAX_LENGTH}
          onChange={(event) =>
            onChange({
              notes: event.target.value.length > 0 ? event.target.value : null,
            })
          }
          placeholder="Who you contacted, what they said, what happens next"
          rows={3}
          value={notes}
        />
      </div>
    </div>
  );
}
