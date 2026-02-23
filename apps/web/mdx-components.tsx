import type { MDXComponents } from "mdx/types";

function withSafeExternalRel(rel?: string) {
  const tokens = new Set((rel ?? "").split(/\s+/).filter(Boolean));
  tokens.add("noopener");
  tokens.add("noreferrer");
  return [...tokens].join(" ");
}

function isExternalHref(href?: string) {
  return typeof href === "string" && /^(https?:)?\/\//.test(href);
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    a: ({ href, rel, target, ...props }) =>
      isExternalHref(href) ? (
        <a
          {...props}
          href={href}
          rel={withSafeExternalRel(rel)}
          target="_blank"
        />
      ) : (
        <a {...props} href={href} rel={rel} target={target} />
      ),
  };
}
