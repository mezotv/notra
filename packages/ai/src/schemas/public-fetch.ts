import { z } from "zod";

export const publicFetchResponseSchema = z.custom<Response>(
  (value) =>
    typeof value === "object" &&
    value !== null &&
    typeof Reflect.get(value, "status") === "number" &&
    typeof Reflect.get(value, "headers") === "object" &&
    typeof Reflect.get(value, "clone") === "function" &&
    typeof Reflect.get(value, "json") === "function"
);
