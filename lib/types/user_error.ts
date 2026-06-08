/**
 * User-facing error shape — safe to render in the UI without raw engine details.
 */

export type user_facing_error = {
  title: string;
  message: string;
  hint?: string;
};
