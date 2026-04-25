import {
  BLOG_FAQ_HEADING_REGEX,
  BLOG_HEADING_REGEX,
  BLOG_NUMBERED_HEADING_PREFIX_REGEX,
  BLOG_PARAGRAPH_REGEX,
  BLOG_TAG_REGEX,
  BLOG_WHITESPACE_REGEX,
  HTML_ENTITY_MAP,
  HTML_ENTITY_REGEX,
  JSON_LD_SCRIPT_CLOSE_REGEX,
  NOTRA_LOGO_PATH,
} from "@/utils/constants";
import { SITE_URL } from "@/utils/urls";
import type { BlogFaqEntry, BlogJsonLdInput, NotraBlogPost } from "~types/blog";

function decodeHtmlEntities(value: string) {
  return value.replace(
    HTML_ENTITY_REGEX,
    (_, entity: string) => HTML_ENTITY_MAP[entity] ?? ""
  );
}

function stripHtml(value: string) {
  return decodeHtmlEntities(value.replace(BLOG_TAG_REGEX, ""))
    .replace(BLOG_WHITESPACE_REGEX, " ")
    .trim();
}

function extractHeadings(html: string) {
  const headings: { level: number; text: string; index: number }[] = [];
  BLOG_HEADING_REGEX.lastIndex = 0;

  let match = BLOG_HEADING_REGEX.exec(html);
  while (match !== null) {
    const [, levelGroup, contentGroup] = match;
    if (levelGroup && contentGroup !== undefined) {
      const text = stripHtml(contentGroup);
      if (text.length > 0) {
        headings.push({
          level: Number(levelGroup),
          text,
          index: match.index,
        });
      }
    }
    match = BLOG_HEADING_REGEX.exec(html);
  }

  return headings;
}

export function extractBlogFaqEntries(html: string): BlogFaqEntry[] {
  const headings = extractHeadings(html);
  const faqHeadingIndex = headings.findIndex(
    (heading) =>
      heading.level === 2 && BLOG_FAQ_HEADING_REGEX.test(heading.text)
  );

  if (faqHeadingIndex === -1) {
    return [];
  }

  const faqHeading = headings[faqHeadingIndex];
  if (!faqHeading) {
    return [];
  }

  const nextH2 = headings
    .slice(faqHeadingIndex + 1)
    .find((heading) => heading.level === 2);

  const sectionStart = faqHeading.index;
  const sectionEnd = nextH2?.index ?? html.length;
  const section = html.slice(sectionStart, sectionEnd);

  const entries: BlogFaqEntry[] = [];
  BLOG_HEADING_REGEX.lastIndex = 0;

  let questionMatch = BLOG_HEADING_REGEX.exec(section);
  while (questionMatch !== null) {
    const [fullMatch, levelGroup, contentGroup] = questionMatch;
    if (!(levelGroup && contentGroup !== undefined && fullMatch)) {
      questionMatch = BLOG_HEADING_REGEX.exec(section);
      continue;
    }

    if (Number(levelGroup) !== 3) {
      questionMatch = BLOG_HEADING_REGEX.exec(section);
      continue;
    }

    const question = stripHtml(contentGroup);
    const answerStart = questionMatch.index + fullMatch.length;
    BLOG_HEADING_REGEX.lastIndex = answerStart;
    const nextHeading = BLOG_HEADING_REGEX.exec(section);
    const nextHeadingIndex = nextHeading?.index ?? section.length;

    const answerSlice = section.slice(answerStart, nextHeadingIndex);
    BLOG_PARAGRAPH_REGEX.lastIndex = 0;
    const answerParts: string[] = [];
    let paragraphMatch = BLOG_PARAGRAPH_REGEX.exec(answerSlice);
    while (paragraphMatch !== null) {
      const paragraphContent = paragraphMatch[1];
      if (paragraphContent !== undefined) {
        const paragraph = stripHtml(paragraphContent);
        if (paragraph.length > 0) {
          answerParts.push(paragraph);
        }
      }
      paragraphMatch = BLOG_PARAGRAPH_REGEX.exec(answerSlice);
    }

    if (question.length > 0 && answerParts.length > 0) {
      entries.push({ question, answer: answerParts.join(" ") });
    }

    BLOG_HEADING_REGEX.lastIndex = nextHeadingIndex;
    questionMatch = BLOG_HEADING_REGEX.exec(section);
  }

  return entries;
}

export function extractBlogAboutEntities(html: string) {
  return extractHeadings(html)
    .filter(
      (heading) =>
        heading.level === 2 && !BLOG_FAQ_HEADING_REGEX.test(heading.text)
    )
    .map((heading) =>
      heading.text.replace(BLOG_NUMBERED_HEADING_PREFIX_REGEX, "")
    )
    .filter((text, index, list) => list.indexOf(text) === index);
}

export function buildBlogArticleJsonLd({
  post,
  url,
  imageUrl,
}: BlogJsonLdInput) {
  const aboutEntities = extractBlogAboutEntities(post.content);
  const publisher = {
    "@type": "Organization",
    name: "Notra",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}${NOTRA_LOGO_PATH}`,
    },
  } as const;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: imageUrl,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: publisher,
    publisher,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    url,
    inLanguage: "en-US",
    keywords: aboutEntities.length > 0 ? aboutEntities.join(", ") : undefined,
    about:
      aboutEntities.length > 0
        ? aboutEntities.map((name) => ({ "@type": "Thing", name }))
        : undefined,
  };
}

export function buildBlogFaqJsonLd(post: NotraBlogPost) {
  const entries = extractBlogFaqEntries(post.content);

  if (entries.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(JSON_LD_SCRIPT_CLOSE_REGEX, "<\\/$1");
}
