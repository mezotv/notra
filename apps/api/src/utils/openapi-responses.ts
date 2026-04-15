import { errorResponseSchema } from "../schemas/content";

export function errorResponse(description: string) {
  return {
    description,
    content: {
      "application/json": {
        schema: errorResponseSchema,
      },
    },
  };
}
