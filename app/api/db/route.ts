/**
 * POST /api/db
 *
 * Single API route that handles all BunnyDB CRUD operations.
 * Request body: { action, userId, ...params }
 *
 * Keeps the BunnyDB auth token server-side.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClient, ensureSchema } from '../../../services/bunnyDB';

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

// ---------------------------------------------------------------------------
// Helpers to serialise/deserialise rows ↔ app objects
// ---------------------------------------------------------------------------

function parseJSON(val: unknown): unknown {
  if (typeof val !== 'string') return val;
  try { return JSON.parse(val); } catch { return val; }
}

function characterFromRow(r: Record<string, unknown>) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    personality: r.personality,
    scenario: r.scenario,
    first_mes: r.first_mes,
    mes_example: r.mes_example,
    avatar: r.avatar ?? undefined,
    gallery: parseJSON(r.gallery) ?? [],
    tags: parseJSON(r.tags) ?? [],
    attachedLorebooks: parseJSON(r.attached_lorebooks) ?? [],
    brain: parseJSON(r.brain) ?? undefined,
    data: parseJSON(r.data) ?? {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function nodeFromRow(r: Record<string, unknown>) {
  return {
    id: r.id,
    characterId: r.character_id,
    title: r.title,
    messages: parseJSON(r.messages) ?? [],
    model: r.model ?? undefined,
    isClosed: r.is_closed === 1,
    compiledAt: r.compiled_at ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function loreEntryFromRow(r: Record<string, unknown>) {
  return {
    id: r.id,
    name: r.name,
    content: r.content,
    keys: parseJSON(r.keys) ?? [],
    category: r.category,
    importance: r.importance,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function lorebookFromRow(r: Record<string, unknown>) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    entries: parseJSON(r.entries) ?? [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const client = getClient();
    const body = await req.json();
    const { action, userId } = body;

    if (!userId) return err('userId is required');
    if (!action) return err('action is required');

    // ---- Characters ----

    if (action === 'getCharacters') {
      const res = await client.execute({
        sql: 'SELECT * FROM characters WHERE user_id = ?',
        args: [userId],
      });
      return json(res.rows.map(r => characterFromRow(r as Record<string, unknown>)));
    }

    if (action === 'getCharacter') {
      const res = await client.execute({
        sql: 'SELECT * FROM characters WHERE id = ? AND user_id = ?',
        args: [body.id, userId],
      });
      const row = res.rows[0];
      return json(row ? characterFromRow(row as Record<string, unknown>) : null);
    }

    if (action === 'saveCharacter') {
      const c = body.data;
      const now = Date.now();
      await client.execute({
        sql: `INSERT OR REPLACE INTO characters
              (id, user_id, name, description, personality, scenario, first_mes, mes_example,
               avatar, gallery, tags, attached_lorebooks, brain, data, created_at, updated_at)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          c.id, userId, c.name ?? '', c.description ?? '', c.personality ?? '',
          c.scenario ?? '', c.first_mes ?? '', c.mes_example ?? '',
          c.avatar ?? null,
          JSON.stringify(c.gallery ?? []),
          JSON.stringify(c.tags ?? []),
          JSON.stringify(c.attachedLorebooks ?? []),
          c.brain ? JSON.stringify(c.brain) : null,
          JSON.stringify(c.data ?? {}),
          c.createdAt ?? now, now,
        ],
      });
      return json({ ok: true });
    }

    if (action === 'deleteCharacter') {
      await client.batch(
        [
          { sql: 'DELETE FROM characters WHERE id = ? AND user_id = ?', args: [body.id, userId] },
          { sql: 'DELETE FROM chat_nodes WHERE character_id = ? AND user_id = ?', args: [body.id, userId] },
        ],
        'write',
      );
      return json({ ok: true });
    }

    // ---- Chat Nodes ----

    if (action === 'getNodes') {
      const res = await client.execute({
        sql: 'SELECT * FROM chat_nodes WHERE user_id = ?',
        args: [userId],
      });
      return json(res.rows.map(r => nodeFromRow(r as Record<string, unknown>)));
    }

    if (action === 'getNode') {
      const res = await client.execute({
        sql: 'SELECT * FROM chat_nodes WHERE id = ? AND user_id = ?',
        args: [body.id, userId],
      });
      const row = res.rows[0];
      return json(row ? nodeFromRow(row as Record<string, unknown>) : null);
    }

    if (action === 'getNodesForCharacter') {
      const res = await client.execute({
        sql: 'SELECT * FROM chat_nodes WHERE character_id = ? AND user_id = ?',
        args: [body.characterId, userId],
      });
      return json(res.rows.map(r => nodeFromRow(r as Record<string, unknown>)));
    }

    if (action === 'saveNode') {
      const n = body.data;
      const now = Date.now();
      await client.execute({
        sql: `INSERT OR REPLACE INTO chat_nodes
              (id, user_id, character_id, title, messages, model, is_closed, compiled_at, created_at, updated_at)
              VALUES (?,?,?,?,?,?,?,?,?,?)`,
        args: [
          n.id, userId, n.characterId, n.title ?? '',
          JSON.stringify(n.messages ?? []),
          n.model ?? null,
          n.isClosed ? 1 : 0,
          n.compiledAt ?? null,
          n.createdAt ?? now, now,
        ],
      });
      return json({ ok: true });
    }

    if (action === 'deleteNode') {
      await client.execute({
        sql: 'DELETE FROM chat_nodes WHERE id = ? AND user_id = ?',
        args: [body.id, userId],
      });
      return json({ ok: true });
    }

    // ---- Lore Entries ----

    if (action === 'getLoreEntries') {
      const res = await client.execute({
        sql: 'SELECT * FROM lore_entries WHERE user_id = ?',
        args: [userId],
      });
      return json(res.rows.map(r => loreEntryFromRow(r as Record<string, unknown>)));
    }

    if (action === 'getLoreEntry') {
      const res = await client.execute({
        sql: 'SELECT * FROM lore_entries WHERE id = ? AND user_id = ?',
        args: [body.id, userId],
      });
      const row = res.rows[0];
      return json(row ? loreEntryFromRow(row as Record<string, unknown>) : null);
    }

    if (action === 'saveLoreEntry') {
      const e = body.data;
      const now = Date.now();
      await client.execute({
        sql: `INSERT OR REPLACE INTO lore_entries
              (id, user_id, name, content, keys, category, importance, created_at, updated_at)
              VALUES (?,?,?,?,?,?,?,?,?)`,
        args: [
          e.id, userId, e.name ?? '', e.content ?? '',
          JSON.stringify(e.keys ?? []),
          e.category ?? 'other',
          e.importance ?? 5,
          e.createdAt ?? now, now,
        ],
      });
      return json({ ok: true });
    }

    if (action === 'deleteLoreEntry') {
      await client.execute({
        sql: 'DELETE FROM lore_entries WHERE id = ? AND user_id = ?',
        args: [body.id, userId],
      });
      // Also remove from any lorebooks
      const booksRes = await client.execute({
        sql: 'SELECT * FROM lorebooks WHERE user_id = ?',
        args: [userId],
      });
      for (const row of booksRes.rows) {
        const r = row as Record<string, unknown>;
        const entries: string[] = parseJSON(r.entries) as string[] ?? [];
        if (entries.includes(body.id)) {
          const updated = entries.filter((eId: string) => eId !== body.id);
          await client.execute({
            sql: 'UPDATE lorebooks SET entries = ? WHERE id = ? AND user_id = ?',
            args: [JSON.stringify(updated), r.id as string, userId],
          });
        }
      }
      return json({ ok: true });
    }

    // ---- Lorebooks ----

    if (action === 'getLorebooks') {
      const res = await client.execute({
        sql: 'SELECT * FROM lorebooks WHERE user_id = ?',
        args: [userId],
      });
      return json(res.rows.map(r => lorebookFromRow(r as Record<string, unknown>)));
    }

    if (action === 'getLorebook') {
      const res = await client.execute({
        sql: 'SELECT * FROM lorebooks WHERE id = ? AND user_id = ?',
        args: [body.id, userId],
      });
      const row = res.rows[0];
      return json(row ? lorebookFromRow(row as Record<string, unknown>) : null);
    }

    if (action === 'saveLorebook') {
      const b = body.data;
      const now = Date.now();
      await client.execute({
        sql: `INSERT OR REPLACE INTO lorebooks
              (id, user_id, name, description, entries, created_at, updated_at)
              VALUES (?,?,?,?,?,?,?)`,
        args: [
          b.id, userId, b.name ?? '', b.description ?? '',
          JSON.stringify(b.entries ?? []),
          b.createdAt ?? now, now,
        ],
      });
      return json({ ok: true });
    }

    if (action === 'deleteLorebook') {
      await client.execute({
        sql: 'DELETE FROM lorebooks WHERE id = ? AND user_id = ?',
        args: [body.id, userId],
      });
      return json({ ok: true });
    }

    // ---- Settings ----

    if (action === 'getSettings') {
      const res = await client.execute({
        sql: 'SELECT data FROM settings WHERE user_id = ?',
        args: [userId],
      });
      const row = res.rows[0] as Record<string, unknown> | undefined;
      return json(row ? parseJSON(row.data) : null);
    }

    if (action === 'saveSettings') {
      await client.execute({
        sql: 'INSERT OR REPLACE INTO settings (user_id, data) VALUES (?, ?)',
        args: [userId, JSON.stringify(body.data)],
      });
      return json({ ok: true });
    }

    // ---- Bulk sync (pull everything for a user) ----

    if (action === 'syncAll') {
      const [chars, nodes, lore, books, settingsRes] = await Promise.all([
        client.execute({ sql: 'SELECT * FROM characters WHERE user_id = ?', args: [userId] }),
        client.execute({ sql: 'SELECT * FROM chat_nodes WHERE user_id = ?', args: [userId] }),
        client.execute({ sql: 'SELECT * FROM lore_entries WHERE user_id = ?', args: [userId] }),
        client.execute({ sql: 'SELECT * FROM lorebooks WHERE user_id = ?', args: [userId] }),
        client.execute({ sql: 'SELECT data FROM settings WHERE user_id = ?', args: [userId] }),
      ]);
      const settingsRow = settingsRes.rows[0] as Record<string, unknown> | undefined;
      return json({
        characters: chars.rows.map(r => characterFromRow(r as Record<string, unknown>)),
        nodes: nodes.rows.map(r => nodeFromRow(r as Record<string, unknown>)),
        loreEntries: lore.rows.map(r => loreEntryFromRow(r as Record<string, unknown>)),
        lorebooks: books.rows.map(r => lorebookFromRow(r as Record<string, unknown>)),
        settings: settingsRow ? parseJSON(settingsRow.data) : null,
      });
    }

    return err(`Unknown action: ${action}`);
  } catch (error: any) {
    console.error('[API /db] Error:', error);
    return err(error?.message ?? 'Internal server error', 500);
  }
}
