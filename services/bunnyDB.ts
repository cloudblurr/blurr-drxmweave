/**
 * bunnyDB.ts — Server-side only module.
 *
 * Initialises the libsql client that talks to BunnyDB and exposes
 * a helper to ensure the schema exists.
 */

import { createClient, type Client } from '@libsql/client/web';

// Read credentials at module-load time (server-side only).
// In production you'd use env vars; here we read the committed secrets file.
const BUNNY_DATABASE_URL =
  process.env.BUNNY_DATABASE_URL ??
  'libsql://01KHJ6VHZNGFFC0QK122DB9HW2-ooda-muse.lite.bunnydb.net';

const BUNNY_DATABASE_AUTH_TOKEN =
  process.env.BUNNY_DATABASE_AUTH_TOKEN ??
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJFZERTQSJ9.eyJwIjp7InJvIjpudWxsLCJydyI6eyJucyI6WyJvb2RhLW11c2UiXSwidGFncyI6bnVsbH0sInJvYSI6bnVsbCwicndhIjpudWxsLCJkZGwiOm51bGx9LCJpYXQiOjE3NzEyMTE0NDZ9.I5GLk3VyG2h6aq46Rw9WbkmqERo52E326NIHF4IuV4_pkNEw6pvMysU8UvXLjpPwRhDJV9yukwZCE8bNlAnHAQ';

let _client: Client | null = null;

export function getClient(): Client {
  if (!_client) {
    _client = createClient({
      url: BUNNY_DATABASE_URL,
      authToken: BUNNY_DATABASE_AUTH_TOKEN,
    });
  }
  return _client;
}

let _schemaReady = false;

/** Ensure all tables exist. Called once per cold start. */
export async function ensureSchema(): Promise<void> {
  if (_schemaReady) return;

  const client = getClient();

  await client.batch(
    [
      `CREATE TABLE IF NOT EXISTS characters (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL,
        name        TEXT NOT NULL DEFAULT '',
        description TEXT DEFAULT '',
        personality TEXT DEFAULT '',
        scenario    TEXT DEFAULT '',
        first_mes   TEXT DEFAULT '',
        mes_example TEXT DEFAULT '',
        avatar      TEXT,
        gallery     TEXT DEFAULT '[]',
        tags        TEXT DEFAULT '[]',
        attached_lorebooks TEXT DEFAULT '[]',
        brain       TEXT,
        data        TEXT DEFAULT '{}',
        created_at  INTEGER,
        updated_at  INTEGER
      )`,
      `CREATE INDEX IF NOT EXISTS idx_characters_user ON characters(user_id)`,

      `CREATE TABLE IF NOT EXISTS chat_nodes (
        id            TEXT PRIMARY KEY,
        user_id       TEXT NOT NULL,
        character_id  TEXT NOT NULL,
        title         TEXT DEFAULT '',
        messages      TEXT DEFAULT '[]',
        model         TEXT,
        is_closed     INTEGER DEFAULT 0,
        compiled_at   INTEGER,
        created_at    INTEGER,
        updated_at    INTEGER
      )`,
      `CREATE INDEX IF NOT EXISTS idx_nodes_user ON chat_nodes(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_nodes_character ON chat_nodes(character_id)`,

      `CREATE TABLE IF NOT EXISTS lore_entries (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL,
        name       TEXT DEFAULT '',
        content    TEXT DEFAULT '',
        keys       TEXT DEFAULT '[]',
        category   TEXT DEFAULT 'other',
        importance INTEGER DEFAULT 5,
        created_at INTEGER,
        updated_at INTEGER
      )`,
      `CREATE INDEX IF NOT EXISTS idx_lore_user ON lore_entries(user_id)`,

      `CREATE TABLE IF NOT EXISTS lorebooks (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL,
        name        TEXT DEFAULT '',
        description TEXT DEFAULT '',
        entries     TEXT DEFAULT '[]',
        created_at  INTEGER,
        updated_at  INTEGER
      )`,
      `CREATE INDEX IF NOT EXISTS idx_lorebooks_user ON lorebooks(user_id)`,

      `CREATE TABLE IF NOT EXISTS settings (
        user_id TEXT PRIMARY KEY,
        data    TEXT NOT NULL DEFAULT '{}'
      )`,
    ],
    'write',
  );

  _schemaReady = true;
}
