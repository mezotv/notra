export type Language = {
  name: string;
  src: () => Promise<unknown>;
};

export const LANGUAGES: { [index: string]: Language } = {
  shell: {
    name: "Bash",
    src: () => import("shiki/langs/bash.mjs"),
  },
  cpp: {
    name: "C++",
    src: () => import("shiki/langs/cpp.mjs"),
  },
  csharp: {
    name: "C#",
    src: () => import("shiki/langs/csharp.mjs"),
  },
  clojure: {
    name: "Clojure",
    src: () => import("shiki/langs/clojure.mjs"),
  },
  css: {
    name: "CSS",
    src: () => import("shiki/langs/css.mjs"),
  },
  dart: {
    name: "Dart",
    src: () => import("shiki/langs/dart.mjs"),
  },
  diff: {
    name: "Diff",
    src: () => import("shiki/langs/diff.mjs"),
  },
  dockerfile: {
    name: "Docker",
    src: () => import("shiki/langs/dockerfile.mjs"),
  },
  elixir: {
    name: "Elixir",
    src: () => import("shiki/langs/elixir.mjs"),
  },
  erlang: {
    name: "Erlang",
    src: () => import("shiki/langs/erlang.mjs"),
  },
  go: {
    name: "Go",
    src: () => import("shiki/langs/go.mjs"),
  },
  graphql: {
    name: "GraphQL",
    src: () => import("shiki/langs/graphql.mjs"),
  },
  haskell: {
    name: "Haskell",
    src: () => import("shiki/langs/haskell.mjs"),
  },
  html: {
    name: "HTML",
    src: () => import("shiki/langs/html.mjs"),
  },
  java: {
    name: "Java",
    src: () => import("shiki/langs/java.mjs"),
  },
  javascript: {
    name: "JavaScript",
    src: () => import("shiki/langs/javascript.mjs"),
  },
  json: {
    name: "JSON",
    src: () => import("shiki/langs/json.mjs"),
  },
  jsx: {
    name: "JSX",
    src: () => import("shiki/langs/jsx.mjs"),
  },
  kotlin: {
    name: "Kotlin",
    src: () => import("shiki/langs/kotlin.mjs"),
  },
  lua: {
    name: "Lua",
    src: () => import("shiki/langs/lua.mjs"),
  },
  markdown: {
    name: "Markdown",
    src: () => import("shiki/langs/markdown.mjs"),
  },
  plaintext: {
    name: "Plaintext",
    src: () => import("shiki/langs/javascript.mjs"),
  },
  php: {
    name: "PHP",
    src: () => import("shiki/langs/php.mjs"),
  },
  python: {
    name: "Python",
    src: () => import("shiki/langs/python.mjs"),
  },
  ruby: {
    name: "Ruby",
    src: () => import("shiki/langs/ruby.mjs"),
  },
  rust: {
    name: "Rust",
    src: () => import("shiki/langs/rust.mjs"),
  },
  scala: {
    name: "Scala",
    src: () => import("shiki/langs/scala.mjs"),
  },
  scss: {
    name: "SCSS",
    src: () => import("shiki/langs/scss.mjs"),
  },
  sql: {
    name: "SQL",
    src: () => import("shiki/langs/sql.mjs"),
  },
  swift: {
    name: "Swift",
    src: () => import("shiki/langs/swift.mjs"),
  },
  toml: {
    name: "TOML",
    src: () => import("shiki/langs/toml.mjs"),
  },
  typescript: {
    name: "TypeScript",
    src: () => import("shiki/langs/typescript.mjs"),
  },
  tsx: {
    name: "TSX",
    src: () => import("shiki/langs/tsx.mjs"),
  },
  vue: {
    name: "Vue",
    src: () => import("shiki/langs/vue.mjs"),
  },
  xml: {
    name: "XML",
    src: () => import("shiki/langs/xml.mjs"),
  },
  yaml: {
    name: "YAML",
    src: () => import("shiki/langs/yaml.mjs"),
  },
  zig: {
    name: "Zig",
    src: () => import("shiki/langs/zig.mjs"),
  },
};
