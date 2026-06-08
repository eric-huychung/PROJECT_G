/**
 * Loads a CSV into DuckDB-Wasm as `uploaded_data` and returns schema metadata.
 */

import type { AsyncDuckDB, AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";

import {
  UPLOADED_CSV_VIRTUAL_NAME,
  UPLOADED_TABLE_NAME,
} from "@/lib/duckdb/constants";
import { decode_csv_bytes } from "@/lib/duckdb/decode_csv_bytes";
import { ingest_failed_error, to_user_error } from "@/lib/errors/ingest_errors";
import { get_duckdb } from "@/lib/duckdb/init_duckdb";
import type { ingest_result } from "@/lib/types/workspace";

type ingest_csv_options = {
  file_name: string;
  bytes: Uint8Array;
};

/**
 * @param options - File name and raw bytes
 * @returns Table metadata after a successful load
 */
export async function ingest_csv(
  options: ingest_csv_options,
): Promise<ingest_result> {
  const { file_name, bytes } = options;
  const raw_bytes = bytes.slice();
  const { db, conn } = await get_duckdb();

  await clear_previous_upload(db, conn);

  const decoded = decode_csv_bytes(raw_bytes);

  await db.registerFileBuffer(
    UPLOADED_CSV_VIRTUAL_NAME,
    decoded.utf8_bytes.slice(),
  );

  try {
    await load_csv_table(conn);
    const metadata = await read_table_metadata(conn);

    if (metadata.row_count === 0 || metadata.columns.length === 0) {
      throw new ingest_failed_error(
        to_user_error(new Error("empty dataset"), "upload"),
      );
    }

    return {
      table_name: UPLOADED_TABLE_NAME,
      file_name,
      file_size_bytes: raw_bytes.byteLength,
      row_count: metadata.row_count,
      columns: metadata.columns,
      csv_encoding: decoded.source_encoding,
    };
  } catch (error) {
    if (error instanceof ingest_failed_error) {
      throw error;
    }

    throw new ingest_failed_error(to_user_error(error, "upload"), {
      cause: error,
    });
  }
}

async function clear_previous_upload(
  db: AsyncDuckDB,
  conn: AsyncDuckDBConnection,
): Promise<void> {
  await conn.query(`DROP TABLE IF EXISTS ${UPLOADED_TABLE_NAME}`);

  try {
    await db.dropFile(UPLOADED_CSV_VIRTUAL_NAME);
  } catch {
    // First upload in this session — nothing to drop.
  }
}

async function load_csv_table(
  conn: AsyncDuckDBConnection,
): Promise<void> {
  await conn.query(`
    CREATE OR REPLACE TABLE ${UPLOADED_TABLE_NAME} AS
    SELECT * FROM read_csv_auto(
      '${UPLOADED_CSV_VIRTUAL_NAME}',
      strict_mode = false
    )
  `);
}

async function read_table_metadata(conn: AsyncDuckDBConnection): Promise<{
  row_count: number;
  columns: { name: string; type: string }[];
}> {
  const describe = await conn.query(`DESCRIBE ${UPLOADED_TABLE_NAME}`);
  const count_result = await conn.query(
    `SELECT COUNT(*)::BIGINT AS row_count FROM ${UPLOADED_TABLE_NAME}`,
  );

  const columns = describe.toArray().map((row) => {
    const record = row.toJSON() as { column_name: string; column_type: string };
    return {
      name: record.column_name,
      type: record.column_type,
    };
  });

  const count_row = count_result.toArray()[0]?.toJSON() as
    | { row_count: bigint | number }
    | undefined;

  return {
    row_count: Number(count_row?.row_count ?? 0),
    columns,
  };
}
