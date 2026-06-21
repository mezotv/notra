// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";

export const SUPPORTED_LICENSES = [
  {
    value: "MIT",
    label: "MIT",
    href: "https://en.wikipedia.org/wiki/MIT_License",
  },
  {
    value: "Apache-2.0",
    label: "Apache 2.0",
    href: "https://en.wikipedia.org/wiki/Apache_License",
  },
  {
    value: "BSD-2-Clause",
    label: "BSD 2-Clause",
    href: "https://en.wikipedia.org/wiki/BSD_licenses#2-clause_license_(%22Simplified_BSD_License%22_or_%22FreeBSD_License%22)",
  },
  {
    value: "BSD-3-Clause",
    label: "BSD 3-Clause",
    href: "https://en.wikipedia.org/wiki/BSD_licenses#3-clause_license_(%22BSD_License_2.0%22,_%22Revised_BSD_License%22,_%22New_BSD_License%22,_or_%22Modified_BSD_License%22)",
  },
  {
    value: "ISC",
    label: "ISC",
    href: "https://en.wikipedia.org/wiki/ISC_license",
  },
  {
    value: "MPL-2.0",
    label: "Mozilla Public License 2.0",
    href: "https://en.wikipedia.org/wiki/Mozilla_Public_License",
  },
  {
    value: "GPL-2.0",
    label: "GPL 2.0",
    href: "https://en.wikipedia.org/wiki/GNU_General_Public_License",
  },
  {
    value: "GPL-3.0",
    label: "GPL 3.0",
    href: "https://en.wikipedia.org/wiki/GNU_General_Public_License",
  },
  {
    value: "LGPL-3.0",
    label: "LGPL 3.0",
    href: "https://en.wikipedia.org/wiki/GNU_Lesser_General_Public_License",
  },
  {
    value: "AGPL-3.0",
    label: "AGPL 3.0",
    href: "https://en.wikipedia.org/wiki/GNU_Affero_General_Public_License",
  },
] as const;

type LicenseValue = (typeof SUPPORTED_LICENSES)[number]["value"];

const LICENSE_VALUES = SUPPORTED_LICENSES.map((license) => license.value) as [
  LicenseValue,
  ...LicenseValue[],
];

const REPO_HOST_REGEX = /^https?:\/\/(www\.)?(github\.com|gitlab\.com)\/.+/i;

export const ossProgramApplicationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(80, "That name is a little too long."),
  email: z.email("Enter a valid email address."),
  projectName: z
    .string()
    .trim()
    .min(2, "Please enter your project name.")
    .max(80, "That project name is a little too long."),
  repositoryUrl: z
    .url("Enter a valid repository URL.")
    .refine(
      (value) => REPO_HOST_REGEX.test(value),
      "Use a public GitHub or GitLab repository URL."
    ),
  license: z.enum(LICENSE_VALUES, {
    error: "Select your project's license.",
  }),
  description: z
    .string()
    .trim()
    .min(20, "Tell us a little more — at least 20 characters.")
    .max(1000, "Please keep this under 1000 characters."),
  assetNeeds: z
    .string()
    .trim()
    .max(1000, "Please keep this under 1000 characters.")
    .optional(),
  isMaintainer: z.literal(true, {
    error: "You must be an owner or maintainer to apply.",
  }),
});
