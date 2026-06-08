/**
 * Zod schemas shared by insight API routes.
 */

import { z } from "zod";

const column_schema = z.object({
  name: z.string(),
  type: z.string(),
});

export const dataset_schema_body = z.object({
  table_name: z.string(),
  columns: z.array(column_schema).min(1),
  row_count: z.number().int().nonnegative(),
});

export const plan_request_schema = z.object({
  schema: dataset_schema_body,
  user_prompt: z.string(),
});

export const query_request_schema = z.object({
  schema: dataset_schema_body,
  question: z.string().min(1),
  query_hint: z
    .object({
      failed_sql: z.string(),
      error: z.string(),
    })
    .optional(),
});

export const narrate_request_schema = z.object({
  question: z.string().min(1),
  sql: z.string().min(1),
  result_preview: z.object({
    columns: z.array(z.string()),
    rows: z.array(z.array(z.string())),
    row_count: z.number().int().nonnegative(),
  }),
});
