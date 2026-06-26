import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import type { CompanyProfileFieldsProps } from "@/types/brand-identity";

export function CompanyProfileFields({ form }: CompanyProfileFieldsProps) {
  return (
    <TitleCard heading="Company Profile">
      <div className="space-y-6">
        <form.Field name="companyName">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Company name</Label>
              <Input
                id={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Your company name"
                value={field.state.value}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="websiteUrl">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Website</Label>
              <div className="flex w-full flex-row items-center rounded-md border border-border transition-colors focus-within:border-ring focus-within:ring-ring/50">
                <label
                  className="border-border border-r px-2.5 py-1.5 text-muted-foreground text-sm transition-colors"
                  htmlFor={field.name}
                >
                  https://
                </label>
                <input
                  aria-label="Website"
                  className="flex-1 bg-transparent px-2.5 py-1.5 text-sm outline-none"
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="example.com"
                  type="text"
                  value={field.state.value}
                />
              </div>
            </div>
          )}
        </form.Field>

        <form.Field name="companyDescription">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Description</Label>
              <Textarea
                className="min-h-30"
                id={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="A short overview of your company"
                value={field.state.value}
              />
            </div>
          )}
        </form.Field>
      </div>
    </TitleCard>
  );
}
