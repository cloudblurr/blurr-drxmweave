/**
 * bunnyClient.ts — Client-side service that talks to /api/db.
 *
 * Mirrors the same function signatures as the localStorage-based storage.ts
 * but sends data to BunnyDB via the Next.js API route. All methods are async.
 */

import type { Character, ChatNode, LoreEntry, Lorebook, AppSettings } from '../types';
import { getCurrentUser } from './authService';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function uid(): string {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  return user.uid;
}

async function dbFetch<T = unknown>(action: string, extra: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, userId: uid(), ...extra }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `DB request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------

export async function getCharacters(): Promise<Character[]> {
  return dbFetch<Character[]>('getCharacters');
}

export async function getCharacter(id: string): Promise<Character | null> {
  return dbFetch<Character | null>('getCharacter', { id });
}

export async function saveCharacter(character: Character): Promise<void> {
  await dbFetch('saveCharacter', { data: character });
}

export async function deleteCharacter(id: string): Promise<void> {
  await dbFetch('deleteCharacter', { id });
}

// ---------------------------------------------------------------------------
// Chat Nodes
// ---------------------------------------------------------------------------

export async function getNodes(): Promise<ChatNode[]> {
  return dbFetch<ChatNode[]>('getNodes');
}

export async function getNode(id: string): Promise<ChatNode | null> {
  return dbFetch<ChatNode | null>('getNode', { id });
}

export async function getNodesForCharacter(characterId: string): Promise<ChatNode[]> {
  return dbFetch<ChatNode[]>('getNodesForCharacter', { characterId });
}

export async function saveNode(node: ChatNode): Promise<void> {
  await dbFetch('saveNode', { data: node });
}

export async function deleteNode(id: string): Promise<void> {
  await dbFetch('deleteNode', { id });
}

// ---------------------------------------------------------------------------
// Lore Entries
// ---------------------------------------------------------------------------

export async function getLoreEntries(): Promise<LoreEntry[]> {
  return dbFetch<LoreEntry[]>('getLoreEntries');
}

export async function getLoreEntry(id: string): Promise<LoreEntry | null> {
  return dbFetch<LoreEntry | null>('getLoreEntry', { id });
}

export async function saveLoreEntry(entry: LoreEntry): Promise<void> {
  await dbFetch('saveLoreEntry', { data: entry });
}

export async function deleteLoreEntry(id: string): Promise<void> {
  await dbFetch('deleteLoreEntry', { id });
}

// ---------------------------------------------------------------------------
// Lorebooks
// ---------------------------------------------------------------------------

export async function getLorebooks(): Promise<Lorebook[]> {
  return dbFetch<Lorebook[]>('getLorebooks');
}

export async function getLorebook(id: string): Promise<Lorebook | null> {
  return dbFetch<Lorebook | null>('getLorebook', { id });
}

export async function saveLorebook(lorebook: Lorebook): Promise<void> {
  await dbFetch('saveLorebook', { data: lorebook });
}

export async function deleteLorebook(id: string): Promise<void> {
  await dbFetch('deleteLorebook', { id });
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function getSettings(): Promise<AppSettings | null> {
  return dbFetch<AppSettings | null>('getSettings');
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await dbFetch('saveSettings', { data: settings });
}

// ---------------------------------------------------------------------------
// Bulk sync — pulls everything from BunnyDB for the current user
// ---------------------------------------------------------------------------

export interface SyncAllResult {
  characters: Character[];
  nodes: ChatNode[];
  loreEntries: LoreEntry[];
  lorebooks: Lorebook[];
  settings: AppSettings | null;
}

export async function syncAll(): Promise<SyncAllResult> {
  return dbFetch<SyncAllResult>('syncAll');
}

// ---------------------------------------------------------------------------
// Migration: push existing localStorage data to BunnyDB
// ---------------------------------------------------------------------------

export async function migrateLocalStorageToBunny(): Promise<void> {
  const STORAGE_KEYS = {
    CHARACTERS: 'rp_characters',
    NODES: 'rp_nodes',
    LORE_ENTRIES: 'rp_lore_entries',
    LOREBOOKS: 'rp_lorebooks',
    SETTINGS: 'rp_settings',
  };

  const charsRaw = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
  if (charsRaw) {
    const chars: Character[] = JSON.parse(charsRaw);
    for (const c of chars) await saveCharacter(c);
  }

  const nodesRaw = localStorage.getItem(STORAGE_KEYS.NODES);
  if (nodesRaw) {
    const nodes: ChatNode[] = JSON.parse(nodesRaw);
    for (const n of nodes) await saveNode(n);
  }

  const loreRaw = localStorage.getItem(STORAGE_KEYS.LORE_ENTRIES);
  if (loreRaw) {
    const entries: LoreEntry[] = JSON.parse(loreRaw);
    for (const e of entries) await saveLoreEntry(e);
  }

  const booksRaw = localStorage.getItem(STORAGE_KEYS.LOREBOOKS);
  if (booksRaw) {
    const books: Lorebook[] = JSON.parse(booksRaw);
    for (const b of books) await saveLorebook(b);
  }

  const settingsRaw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (settingsRaw) {
    const settings: AppSettings = JSON.parse(settingsRaw);
    await saveSettings(settings);
  }

  localStorage.setItem('bunny_migrated', 'true');
}
