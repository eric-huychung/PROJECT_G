/**
 * Lazy DuckDB-Wasm singleton — loaded on first CSV ingest.
 */

import type { AsyncDuckDB, AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";

export type duckdb_handle = {
  db: AsyncDuckDB;
  conn: AsyncDuckDBConnection;
};

let duckdb_promise: Promise<duckdb_handle> | null = null;

/** Returns the shared in-browser DuckDB instance. */
export function get_duckdb(): Promise<duckdb_handle> {
  if (!duckdb_promise) {
    duckdb_promise = create_duckdb();
  }

  return duckdb_promise;
}

/** Tears down DuckDB — used by clear-workspace. */
export async function reset_duckdb(): Promise<void> {
  if (!duckdb_promise) {
    return;
  }

  const { db, conn } = await duckdb_promise;
  await conn.close();
  await db.terminate();
  duckdb_promise = null;
}

async function create_duckdb(): Promise<duckdb_handle> {
  const duckdb = await import("@duckdb/duckdb-wasm");

  const bundles = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(bundles);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], {
      type: "text/javascript",
    }),
  );

  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);

  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(worker_url);

  const conn = await db.connect();

  return { db, conn };
}
