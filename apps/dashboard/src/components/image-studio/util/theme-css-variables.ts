import type { ThemeRegistration } from "@shikijs/core";

export interface CssVariablesThemeOptions {
  name?: string;
  variablePrefix?: string;
  variableDefaults?: Record<string, string>;
  fontStyle?: boolean;
}

export function createCssVariablesTheme(
  options: CssVariablesThemeOptions = {}
): ThemeRegistration {
  const {
    name = "css-variables",
    variablePrefix = "--ray-",
    fontStyle = true,
  } = options;

  const variable = (n: string) => {
    if (options.variableDefaults?.[n])
      return `var(${variablePrefix}${n}, ${options.variableDefaults[n]})`;
    return `var(${variablePrefix}${n})`;
  };

  const theme: ThemeRegistration = {
    name,
    type: "dark",
    colors: {
      "editor.foreground": variable("foreground"),
      "editor.background": variable("background"),
    },
    tokenColors: [
      {
        scope: [
          "keyword.operator.accessor",
          "meta.group.braces.round.function.arguments",
          "meta.template.expression",
          "markup.fenced_code meta.embedded.block",
        ],
        settings: { foreground: variable("foreground") },
      },
      {
        scope: "emphasis",
        settings: { fontStyle: "italic" },
      },
      {
        scope: ["strong", "markup.heading.markdown", "markup.bold.markdown"],
        settings: { fontStyle: "bold" },
      },
      {
        scope: ["markup.italic.markdown"],
        settings: { fontStyle: "italic" },
      },
      {
        scope: "meta.link.inline.markdown",
        settings: {
          fontStyle: "underline",
          foreground: variable("token-link"),
        },
      },
      {
        scope: [
          "string",
          "markup.fenced_code",
          "markup.inline",
          "string.quoted.docstring.multi.python",
        ],
        settings: { foreground: variable("token-string") },
      },
      {
        scope: [
          "comment",
          "string.quoted.docstring.multi",
          "meta.diff.header.from-file",
          "meta.diff.header.to-file",
        ],
        settings: { foreground: variable("token-comment") },
      },
      {
        scope: [
          "constant.numeric",
          "constant.language",
          "constant.other.placeholder",
          "constant.character.format.placeholder",
          "variable.language.this",
          "variable.other.object",
          "variable.other.class",
          "variable.other.constant",
          "meta.property-name",
          "meta.property-value",
          "support",
        ],
        settings: { foreground: variable("token-constant") },
      },
      {
        scope: [
          "keyword",
          "storage.modifier",
          "storage.type",
          "storage.control.clojure",
          "entity.name.function.clojure",
          "entity.name.tag.yaml",
          "support.function.node",
          "support.type.property-name.json",
          "punctuation.separator.key-value",
          "punctuation.definition.template-expression",
        ],
        settings: { foreground: variable("token-keyword") },
      },
      {
        scope: "variable.parameter.function",
        settings: { foreground: variable("token-parameter") },
      },
      {
        scope: [
          "support.function",
          "entity.name.type",
          "entity.other.inherited-class",
          "meta.function-call",
          "meta.instance.constructor",
          "entity.other.attribute-name",
          "entity.name.function",
          "constant.keyword.clojure",
        ],
        settings: { foreground: variable("token-function") },
      },
      {
        scope: [
          "entity.name.tag",
          "string.quoted",
          "string.regexp",
          "string.interpolated",
          "string.template",
          "string.unquoted.plain.out.yaml",
          "keyword.other.template",
        ],
        settings: { foreground: variable("token-string-expression") },
      },
      {
        scope: [
          "punctuation.definition.arguments",
          "punctuation.definition.dict",
          "punctuation.separator",
          "meta.function-call.arguments",
        ],
        settings: { foreground: variable("token-punctuation") },
      },
      {
        scope: [
          "markup.underline.link",
          "punctuation.definition.metadata.markdown",
        ],
        settings: { foreground: variable("token-link") },
      },
      {
        scope: ["beginning.punctuation.definition.list.markdown"],
        settings: { foreground: variable("token-string") },
      },
      {
        scope: [
          "punctuation.definition.string.begin.markdown",
          "punctuation.definition.string.end.markdown",
          "string.other.link.title.markdown",
          "string.other.link.description.markdown",
        ],
        settings: { foreground: variable("token-keyword") },
      },
      {
        scope: [
          "constant.numeric.decimal",
          "constant.language.boolean",
          "meta.var.exp.ts",
        ],
        settings: { foreground: variable("token-number") },
      },
      {
        scope: ["meta.objectliteral"],
        settings: { foreground: variable("token-object-literal") },
      },
      {
        scope: ["support.variable.property"],
        settings: { foreground: variable("token-property") },
      },
      {
        scope: ["punctuation.definition.deleted.diff", "markup.deleted.diff"],
        settings: { foreground: variable("token-diff-deleted") },
      },
      {
        scope: ["punctuation.definition.inserted.diff", "markup.inserted.diff"],
        settings: { foreground: variable("token-diff-inserted") },
      },
    ],
  };

  if (!fontStyle) {
    theme.tokenColors = theme.tokenColors?.map((tokenColor) => {
      if (tokenColor.settings?.fontStyle) {
        const { fontStyle: _, ...rest } = tokenColor.settings;
        return { ...tokenColor, settings: rest };
      }
      return tokenColor;
    });
  }

  return theme;
}
