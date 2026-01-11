/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as brand from "../brand.js";
import type * as http from "../http.js";
import type * as integrations from "../integrations.js";
import type * as outputs from "../outputs.js";
import type * as posts from "../posts.js";
import type * as repositories from "../repositories.js";
import type * as webhookActions from "../webhookActions.js";
import type * as webhook_logs from "../webhook_logs.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  brand: typeof brand;
  http: typeof http;
  integrations: typeof integrations;
  outputs: typeof outputs;
  posts: typeof posts;
  repositories: typeof repositories;
  webhookActions: typeof webhookActions;
  webhook_logs: typeof webhook_logs;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: {};
};
