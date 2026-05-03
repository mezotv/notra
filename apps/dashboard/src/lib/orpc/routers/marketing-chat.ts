import { getResend } from "@notra/email/utils/resend";
import {
  listMarketingChatRecipients,
  sendMarketingChatBatch,
} from "@/lib/email/marketing-chat";
import { authorizedProcedure } from "@/lib/orpc/base";
import { internalServerError } from "@/lib/orpc/utils/errors";

export const marketingChatRouter = {
  list: authorizedProcedure.handler(async () => {
    const recipients = await listMarketingChatRecipients();
    return { recipients };
  }),
  send: authorizedProcedure.handler(async () => {
    const resend = getResend();
    if (!resend) {
      throw internalServerError("RESEND_API_KEY is not configured");
    }

    const recipients = await listMarketingChatRecipients();
    const results = await sendMarketingChatBatch(resend, recipients);

    const sent = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return { results, sent, failed };
  }),
};
