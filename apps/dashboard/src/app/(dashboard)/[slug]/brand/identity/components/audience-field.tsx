import { Label } from "@notra/ui/components/ui/label";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import type { AudienceFieldProps } from "@/types/brand-identity";

export function AudienceField({ form }: AudienceFieldProps) {
  return (
    <TitleCard className="lg:col-span-2" heading="Target Audience">
      <form.Field name="audience">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Who are you writing for?</Label>
            <Textarea
              className="min-h-30"
              id={field.name}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Describe your target audience - their interests, pain points, and what matters to them"
              value={field.state.value}
            />
          </div>
        )}
      </form.Field>
    </TitleCard>
  );
}
