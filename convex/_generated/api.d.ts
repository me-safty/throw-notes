/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as helpers_auth from "../helpers/auth.js";
import type * as lib_time from "../lib/time.js";
import type * as notes from "../notes.js";
import type * as notifications from "../notifications.js";
import type * as pushTokens from "../pushTokens.js";
import type * as reminders from "../reminders.js";
import type * as schedules from "../schedules.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  "helpers/auth": typeof helpers_auth;
  "lib/time": typeof lib_time;
  notes: typeof notes;
  notifications: typeof notifications;
  pushTokens: typeof pushTokens;
  reminders: typeof reminders;
  schedules: typeof schedules;
  validators: typeof validators;
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

export declare const components: {};
