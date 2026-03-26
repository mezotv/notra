"use client";

import { ChangelogEditor } from "./changelog-editor";
import { LinkedInEditor } from "./linkedin-editor";
import { TwitterEditor } from "./twitter-editor";
import type { ContentEditorProps } from "./types";

export type {
  ContentData,
  ContentEditorProps,
  EditorActions,
  EditorState,
  OrganizationInfo,
} from "./types";

interface ContentEditorSwitchProps extends ContentEditorProps {
  contentType: string;
}

export function ContentEditorSwitch({
  contentType,
  ...props
}: ContentEditorSwitchProps) {
  switch (contentType) {
    case "linkedin_post":
      return <LinkedInEditor {...props} />;

    case "twitter_post":
      return <TwitterEditor {...props} />;

    default:
      return <ChangelogEditor {...props} />;
  }
}
