"use client";

import { Label } from "@notra/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { useState } from "react";

const TONE_OPTIONS = [
  { value: "Conversational", label: "Conversational" },
  { value: "Professional", label: "Professional" },
  { value: "Casual", label: "Casual" },
  { value: "Formal", label: "Formal" },
];

interface BrandVoicePreviewProps {
  className?: string;
}

export default function BrandVoicePreview({
  className = "",
}: BrandVoicePreviewProps) {
  const [toneProfile, setToneProfile] = useState("Conversational");

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="flex flex-col gap-3 pt-4">
        <div className="mr-[-30%]">
          <div className="flex flex-col rounded-[20px] border border-border/80 bg-muted/80 p-2">
            <div className="flex items-start justify-between gap-4 py-1.5 pr-2 pl-2">
              <p className="min-w-0 truncate font-medium text-lg">
                Company Profile
              </p>
            </div>
            <div className="flex-1 rounded-[12px] border border-border/80 bg-background px-4 py-3">
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  className="min-h-[80px] resize-none"
                  defaultValue="Notra connects to GitHub, Linear, and Slack to turn shipped work into ready-to-publish content."
                  placeholder="A short overview of your company"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="-mr-6 ml-[20%]">
          <div className="flex flex-col rounded-[20px] border border-border/80 bg-muted/80 p-2">
            <div className="flex items-start justify-between gap-4 py-1.5 pr-2 pl-2">
              <p className="min-w-0 truncate font-medium text-lg">
                Tone & Language
              </p>
            </div>
            <div className="flex-1 rounded-[12px] border border-border/80 bg-background px-4 py-3">
              <div className="space-y-3">
                <span className="flex cursor-pointer items-center gap-2">
                  <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <svg
                      aria-hidden="true"
                      className="size-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-sm">Tone Profile</span>
                </span>
                <Select
                  onValueChange={(value) => {
                    if (value) {
                      setToneProfile(value);
                    }
                  }}
                  value={toneProfile}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
