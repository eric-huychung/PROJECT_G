/**
 * Normalizes CSV bytes to UTF-8 before DuckDB ingest.
 */

import type { csv_encoding } from "@/lib/types/workspace";

export type decoded_csv = {
  utf8_bytes: Uint8Array;
  source_encoding: csv_encoding;
};

/**
 * @param bytes - Raw file bytes from upload or IndexedDB
 * @returns UTF-8 bytes and detected source encoding
 */
export function decode_csv_bytes(bytes: Uint8Array): decoded_csv {
  const bom_encoding = detect_bom_encoding(bytes);
  if (bom_encoding) {
    return transcode(bytes, bom_encoding);
  }

  if (is_valid_utf8(bytes)) {
    return { utf8_bytes: bytes, source_encoding: "utf-8" };
  }

  return transcode(bytes, "latin-1");
}

function detect_bom_encoding(bytes: Uint8Array): csv_encoding | null {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return "utf-16le";
  }

  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return "utf-16be";
  }

  return null;
}

function is_valid_utf8(bytes: Uint8Array): boolean {
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

function transcode(bytes: Uint8Array, source_encoding: csv_encoding): decoded_csv {
  const label =
    source_encoding === "latin-1"
      ? "latin1"
      : source_encoding;
  const text = new TextDecoder(label).decode(bytes);

  return {
    utf8_bytes: new TextEncoder().encode(text),
    source_encoding,
  };
}
