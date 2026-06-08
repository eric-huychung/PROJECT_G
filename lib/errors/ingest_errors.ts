/**
 * Maps ingest failures to UI-safe error messages.
 */

import type { user_facing_error } from "@/lib/types/user_error";

export class ingest_failed_error extends Error {
  readonly user_error: user_facing_error;

  constructor(user_error: user_facing_error, options?: ErrorOptions) {
    super(user_error.title, options);
    this.name = "ingest_failed_error";
    this.user_error = user_error;
  }
}

/**
 * @param error - Caught ingest or rehydrate failure
 * @param context - Upload flow vs reopening a saved workspace
 */
export function to_user_error(
  error: unknown,
  context: "upload" | "rehydrate" = "upload",
): user_facing_error {
  if (error instanceof ingest_failed_error) {
    return error.user_error;
  }

  const normalized = extract_raw_message(error).toLowerCase();

  if (
    /utf-8|unicode|byte sequence|encoding|invalid input error: csv/i.test(
      normalized,
    )
  ) {
    return {
      title: "We couldn't read this file's text encoding",
      message:
        "This CSV isn't saved as standard UTF-8, so the browser couldn't decode every character.",
      hint: "Re-export the file from Excel or Google Sheets as UTF-8 CSV, then try again.",
    };
  }

  if (/csv error|could not convert|parser|delimiter|quote/i.test(normalized)) {
    return {
      title: "This doesn't look like a valid CSV",
      message:
        "We found rows or columns that don't match a typical comma-separated file.",
      hint: "Check that the file opens correctly in a spreadsheet app, then upload again.",
    };
  }

  if (/empty|no columns|0 rows/i.test(normalized)) {
    return {
      title: "This file looks empty",
      message: "We didn't find any rows to analyze.",
      hint: "Choose a CSV that has a header row and at least one data row.",
    };
  }

  if (/worker|wasm|instantiate|duckdb/i.test(normalized)) {
    return {
      title: "The local database didn't start",
      message:
        "Something went wrong while loading the in-browser analysis engine.",
      hint: "Refresh the page and try again. If it keeps failing, try a smaller CSV.",
    };
  }

  if (/already exists|already registered|duplicate/i.test(normalized)) {
    return {
      title: "We couldn't replace your previous dataset",
      message:
        "The earlier file was still loaded in memory from this browser tab.",
      hint: "Refresh the page and upload again, or try once more.",
    };
  }

  if (/indexeddb|quota|storage/i.test(normalized)) {
    return {
      title: "We couldn't save this file on your device",
      message: "Your browser blocked or ran out of local storage space.",
      hint: "Free up browser storage or clear an old workspace, then try again.",
    };
  }

  if (context === "rehydrate") {
    return {
      title: "We couldn't reopen your saved dataset",
      message:
        "The file was saved earlier, but it couldn't be loaded into analysis memory.",
      hint: "Go back to the landing page and upload the CSV again.",
    };
  }

  return {
    title: "We couldn't load this CSV",
    message: "Something unexpected went wrong while preparing your file.",
    hint: "Try a different export, or re-save the file as UTF-8 CSV and upload again.",
  };
}

function extract_raw_message(error: unknown): string {
  if (error instanceof Error) {
    const cause =
      error.cause instanceof Error ? error.cause.message : String(error.cause ?? "");
    return [error.message, cause].filter(Boolean).join(" ");
  }

  return typeof error === "string" ? error : "";
}
