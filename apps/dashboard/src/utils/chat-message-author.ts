import type {
  ChatMessageAuthor,
  ResolveChatMessageAuthorInput,
} from "@/types/chat";

export function toChatMessageAuthor(user: {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
}): ChatMessageAuthor {
  return {
    id: user.id,
    name: user.name,
    image: user.image ?? null,
    seed: user.email,
  };
}

export function unknownChatMessageAuthor(
  authorUserId: string
): ChatMessageAuthor {
  return { id: authorUserId, name: null, image: null, seed: authorUserId };
}

export function shouldShowChatAuthorAvatars({
  isSlackMirrored,
  memberCount,
}: {
  isSlackMirrored: boolean;
  memberCount: number;
}) {
  return !isSlackMirrored && memberCount > 1;
}

export function resolveChatMessageAuthor({
  metadata,
  membersById,
  sessionUser,
}: ResolveChatMessageAuthorInput): ChatMessageAuthor | null {
  const authorUserId = metadata?.authorUserId;
  if (authorUserId) {
    const member = membersById.get(authorUserId);
    if (member) {
      return member;
    }
    if (sessionUser && sessionUser.id === authorUserId) {
      return toChatMessageAuthor(sessionUser);
    }
    // Author left the organization: fall back to a seeded placeholder avatar.
    return unknownChatMessageAuthor(authorUserId);
  }
  const externalSource = metadata?.externalChannelId?.source;
  if (externalSource && externalSource !== "dashboard") {
    return null;
  }
  // Legacy messages without an author were written before authorship was
  // stored; attribute them to the viewer.
  return sessionUser ? toChatMessageAuthor(sessionUser) : null;
}
