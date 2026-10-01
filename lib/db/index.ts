import "server-only";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type AppDb =
  | ReturnType<typeof drizzlePg<typeof schema>>
  | ReturnType<typeof drizzlePglite<typeof schema>>;

const g = globalThis as typeof globalThis & { __dongetoDb?: Promise<AppDb> };

async function init(): Promise<AppDb> {
  const url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    try {
      const client = postgres(url, { max: 4, connect_timeout: 2 });
      const d = drizzlePg(client, { schema });
      await client`select 1`;
      return d;
    } catch {
      // local: docker not up → file db
    }
  }
  const dir = path.join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(path.join(dir, "dongeto"));
  await client.waitReady;
  const sql = readFileSync(path.join(process.cwd(), "drizzle/init.sql"), "utf8");
  await client.exec(sql);
  return drizzlePglite(client, { schema });
}

export function db(): Promise<AppDb> {
  if (!g.__dongetoDb) g.__dongetoDb = init();
  return g.__dongetoDb;
}
