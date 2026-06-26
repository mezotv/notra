import type { BrandFormProps } from "@/types/brand-identity";
import { useBrandForm } from "../../../../../../lib/hooks/use-brand-form";
import { useUserLocales } from "../../../../../../lib/hooks/use-user-locales";
import { AudienceField } from "./audience-field";
import { CompanyProfileFields } from "./company-profile-fields";
import { ToneLanguageFields } from "./tone-language-fields";

export function BrandForm(props: BrandFormProps) {
  const form = useBrandForm(props);
  const userLocales = useUserLocales();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <CompanyProfileFields form={form} />
      <ToneLanguageFields form={form} userLocales={userLocales} />
      <AudienceField form={form} />
    </div>
  );
}
