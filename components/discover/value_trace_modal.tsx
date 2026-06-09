/**
 * Value trace modal — source table and SQL for a quick insight.
 */

"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, X } from "lucide-react";

import {
  copy_text_to_clipboard,
  format_trace_sql,
  format_trace_table_csv,
} from "@/lib/trace/format_trace_clipboard";
import type { insight_trace } from "@/lib/types/discover";
import { cn } from "@/lib/utils";

const SQL_KEYWORDS = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "GROUP",
  "BY",
  "ORDER",
  "AS",
  "AND",
  "OR",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "IN",
  "LIMIT",
  "WITH",
  "CROSS",
  "JOIN",
  "OVER",
  "DESC",
  "ASC",
  "ROUND",
  "SUM",
  "ROW_NUMBER",
]);

const COPY_BUTTON_CLASS =
  "absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-g-gray transition-colors hover:bg-g-fill hover:text-g-ink";

type copy_button_props = {
  label: string;
  get_text: () => string;
};

/** Copies trace content to the clipboard with brief confirmation. */
function CopyButton({ label, get_text }: copy_button_props) {
  const [copied, set_copied] = useState(false);

  const handle_copy = async () => {
    const ok = await copy_text_to_clipboard(get_text());
    if (!ok) {
      return;
    }

    set_copied(true);
    window.setTimeout(() => set_copied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={() => void handle_copy()}
      aria-label={copied ? `${label} copied` : label}
      title={copied ? "Copied" : label}
      className={COPY_BUTTON_CLASS}
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}

function token_class(token: string): string {
  const upper = token.toUpperCase();
  if (SQL_KEYWORDS.has(upper)) {
    return "text-violet-600";
  }
  if (/^'.*'$/.test(token) || /^\d/.test(token)) {
    return "text-emerald-600";
  }
  return "text-g-ink";
}

function highlight_sql_line(line: string, line_key: number) {
  const parts = line.split(/(\s+|[(),]|\*)/g).filter(Boolean);

  return (
    <span key={line_key}>
      {parts.map((part, index) => {
        if (
          /^\s+$/.test(part) ||
          part === "," ||
          part === "(" ||
          part === ")" ||
          part === "*"
        ) {
          return <span key={index}>{part}</span>;
        }

        return (
          <span key={index} className={token_class(part)}>
            {part}
          </span>
        );
      })}
    </span>
  );
}

type value_trace_modal_props = {
  trace: insight_trace;
  on_close: () => void;
};

/**
 * @param props - Trace payload and close handler
 */
export function ValueTraceModal({ trace, on_close }: value_trace_modal_props) {
  const [sql_open, set_sql_open] = useState(false);
  const sql_lines = trace.sql.trim().split("\n");

  useEffect(() => {
    const handle_escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        on_close();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handle_escape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handle_escape);
    };
  }, [on_close]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="value-trace-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-g-navy/30 backdrop-blur-sm"
        onClick={on_close}
        aria-label="Close value trace"
      />

      <div className="relative z-10 flex max-h-[min(90vh,820px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-g-white shadow-[0_24px_80px_rgb(35_47_62_/_0.18)]">
        <div className="flex items-start justify-between gap-4 border-b border-g-fill px-6 py-5">
          <div className="min-w-0">
            <p
              id="value-trace-title"
              className="text-sm font-medium text-g-gray"
            >
              {trace.label}
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-g-ink">
              {trace.primary_value}
            </p>
          </div>
          <button
            type="button"
            onClick={on_close}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-g-gray transition-colors hover:bg-g-fill hover:text-g-ink"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
          <div className="relative">
            <CopyButton
              label="Copy table as CSV"
              get_text={() => format_trace_table_csv(trace.table)}
            />
            <div className="overflow-x-auto rounded-xl border border-g-fill">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-g-fill/80">
                    {trace.table.columns.map((column) => (
                      <th
                        key={column}
                        className="border border-g-fill px-3 py-2.5 font-semibold text-g-ink"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trace.table.rows.map((row, row_index) => (
                    <tr key={row_index}>
                      {row.map((cell, col_index) => {
                        const is_highlight =
                          trace.table.highlight.row === row_index &&
                          trace.table.highlight.col === col_index;

                        return (
                          <td
                            key={col_index}
                            className={cn(
                              "border border-g-fill px-3 py-2.5 text-g-ink",
                              is_highlight &&
                                "bg-amber-50 font-medium ring-1 ring-inset ring-amber-300",
                            )}
                          >
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => set_sql_open((open) => !open)}
              className="inline-flex items-center gap-2 rounded-xl border border-g-fill bg-g-white px-4 py-2 text-sm font-medium text-g-ink transition-colors hover:bg-g-fill/60"
            >
              View SQL
              {sql_open ? (
                <ChevronUp className="h-4 w-4 text-g-gray" />
              ) : (
                <ChevronDown className="h-4 w-4 text-g-gray" />
              )}
            </button>
            <p className="text-xs text-g-gray">
              Last updated {trace.last_updated}
            </p>
          </div>

          {sql_open ? (
            <div className="relative mt-4">
              <CopyButton
                label="Copy SQL"
                get_text={() => format_trace_sql(trace.sql)}
              />
              <div className="overflow-x-auto rounded-xl bg-g-fill/70 p-4">
                <pre className="font-mono text-[13px] leading-6">
                  {sql_lines.map((line, index) => (
                    <div key={index} className="flex gap-4">
                      <span className="w-6 shrink-0 select-none text-right text-g-gray/70">
                        {index + 1}
                      </span>
                      <code>{highlight_sql_line(line, index)}</code>
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
