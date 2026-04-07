import { Character, ChatNode, LoreEntry, Lorebook, AppSettings } from '../types';
import { DEFAULT_THEME_ID } from '../themePresets';
import * as bunnyClient from './bunnyClient';
import { getCurrentUser } from './authService';
import { normalizeNodeMessages } from '../lib/messageFormatting';

// ---------------------------------------------------------------------------
// BunnyDB write-through helper
// Silently pushes writes to BunnyDB when the user is authenticated.
// localStorage stays the authoritative sync cache for immediate reads.
// ---------------------------------------------------------------------------

function isAuthenticated(): boolean {
  try {
    return !!getCurrentUser();
  } catch {
    return false;
  }
}

/**
 * Clear all app data from localStorage.
 * Called on sign-out and before syncing a new user's data.
 */
export function clearLocalUserData(): void {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}

/**
 * Load everything from BunnyDB into localStorage.
 * Clears existing data first so a new user never sees a previous user's content.
 * Called once after the user signs in / on page load when authed.
 */
export async function syncFromBunnyDB(): Promise<void> {
  if (!isAuthenticated()) return;
  try {
    // Wipe previous user's cached data before populating
    clearLocalUserData();

    const result = await bunnyClient.syncAll();
    if (result.characters?.length)  localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(result.characters));
    if (result.nodes?.length)       localStorage.setItem(STORAGE_KEYS.NODES, JSON.stringify(result.nodes));
    if (result.loreEntries?.length) localStorage.setItem(STORAGE_KEYS.LORE_ENTRIES, JSON.stringify(result.loreEntries));
    if (result.lorebooks?.length)   localStorage.setItem(STORAGE_KEYS.LOREBOOKS, JSON.stringify(result.lorebooks));
    if (result.settings)            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(result.settings));
    console.log('[Storage] Synced from BunnyDB');
  } catch (err) {
    console.warn('[Storage] BunnyDB sync failed, using local cache', err);
  }
}

// Storage Keys
const STORAGE_KEYS = {
  CHARACTERS: 'rp_characters',
  NODES: 'rp_nodes',
  LORE_ENTRIES: 'rp_lore_entries',
  LOREBOOKS: 'rp_lorebooks',
  SETTINGS: 'rp_settings',
};

const MESSAGE_FORMAT_MIGRATION_KEY = 'rp_msg_format_migration_v1';
let messageFormatMigrationRan = false;

function migrateNodeMessageFormatting(nodes: ChatNode[]): ChatNode[] {
  if (typeof window === 'undefined') return nodes;
  if (messageFormatMigrationRan || localStorage.getItem(MESSAGE_FORMAT_MIGRATION_KEY)) {
    messageFormatMigrationRan = true;
    return nodes;
  }

  let changed = false;
  const migrated = nodes.map((node) => {
    const normalized = normalizeNodeMessages(node);
    if (normalized !== node) changed = true;
    return normalized;
  });

  if (changed) {
    localStorage.setItem(STORAGE_KEYS.NODES, JSON.stringify(migrated));
    if (isAuthenticated()) {
      migrated.forEach((node) => bunnyClient.saveNode(node).catch(console.warn));
    }
  }

  localStorage.setItem(MESSAGE_FORMAT_MIGRATION_KEY, '1');
  messageFormatMigrationRan = true;
  return migrated;
}

// Helper function
export const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

// --- Characters ---
export function getCharacters(): Character[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
  return data ? JSON.parse(data) : [];
}

export function getCharacter(id: string): Character | undefined {
  return getCharacters().find(c => c.id === id);
}

export function saveCharacter(character: Character): void {
  const characters = getCharacters();
  const index = characters.findIndex(c => c.id === character.id);
  if (index >= 0) {
    characters[index] = { ...character, updatedAt: Date.now() };
  } else {
    characters.push(character);
  }
  localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
  if (isAuthenticated()) bunnyClient.saveCharacter(character).catch(console.warn);
}

export function deleteCharacter(id: string): void {
  const characters = getCharacters().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
  
  // Also delete related nodes
  const nodes = getNodes().filter(n => n.characterId !== id);
  localStorage.setItem(STORAGE_KEYS.NODES, JSON.stringify(nodes));
  if (isAuthenticated()) bunnyClient.deleteCharacter(id).catch(console.warn);
}

// --- Chat Nodes ---
export function getNodes(): ChatNode[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.NODES);
  const nodes = data ? JSON.parse(data) : [];
  return migrateNodeMessageFormatting(nodes);
}

export function getNode(id: string): ChatNode | undefined {
  return getNodes().find(n => n.id === id);
}

export function getNodesForCharacter(characterId: string): ChatNode[] {
  return getNodes().filter(n => n.characterId === characterId);
}

export function saveNode(node: ChatNode): void {
  const nodes = getNodes();
  const index = nodes.findIndex(n => n.id === node.id);
  if (index >= 0) {
    nodes[index] = { ...node, updatedAt: Date.now() };
  } else {
    nodes.push(node);
  }
  localStorage.setItem(STORAGE_KEYS.NODES, JSON.stringify(nodes));
  if (isAuthenticated()) bunnyClient.saveNode(node).catch(console.warn);
}

export function deleteNode(id: string): void {
  const nodes = getNodes().filter(n => n.id !== id);
  localStorage.setItem(STORAGE_KEYS.NODES, JSON.stringify(nodes));
  if (isAuthenticated()) bunnyClient.deleteNode(id).catch(console.warn);
}

// --- Lore Entries ---
export function getLoreEntries(): LoreEntry[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.LORE_ENTRIES);
  return data ? JSON.parse(data) : [];
}

export function getLoreEntry(id: string): LoreEntry | undefined {
  return getLoreEntries().find(e => e.id === id);
}

export function saveLoreEntry(entry: LoreEntry): void {
  const entries = getLoreEntries();
  const index = entries.findIndex(e => e.id === entry.id);
  if (index >= 0) {
    entries[index] = { ...entry, updatedAt: Date.now() };
  } else {
    entries.push(entry);
  }
  localStorage.setItem(STORAGE_KEYS.LORE_ENTRIES, JSON.stringify(entries));
  if (isAuthenticated()) bunnyClient.saveLoreEntry(entry).catch(console.warn);
}

export function deleteLoreEntry(id: string): void {
  const entries = getLoreEntries().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.LORE_ENTRIES, JSON.stringify(entries));
  
  // Remove from lorebooks
  const lorebooks = getLorebooks();
  lorebooks.forEach(book => {
    book.entries = book.entries.filter(eId => eId !== id);
  });
  localStorage.setItem(STORAGE_KEYS.LOREBOOKS, JSON.stringify(lorebooks));
  if (isAuthenticated()) bunnyClient.deleteLoreEntry(id).catch(console.warn);
}

// --- Lorebooks ---
export function getLorebooks(): Lorebook[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.LOREBOOKS);
  return data ? JSON.parse(data) : [];
}

export function getLorebook(id: string): Lorebook | undefined {
  return getLorebooks().find(b => b.id === id);
}

export function saveLorebook(lorebook: Lorebook): void {
  const lorebooks = getLorebooks();
  const index = lorebooks.findIndex(b => b.id === lorebook.id);
  if (index >= 0) {
    lorebooks[index] = { ...lorebook, updatedAt: Date.now() };
  } else {
    lorebooks.push(lorebook);
  }
  localStorage.setItem(STORAGE_KEYS.LOREBOOKS, JSON.stringify(lorebooks));
  if (isAuthenticated()) bunnyClient.saveLorebook(lorebook).catch(console.warn);
}

export function deleteLorebook(id: string): void {
  const lorebooks = getLorebooks().filter(b => b.id !== id);
  localStorage.setItem(STORAGE_KEYS.LOREBOOKS, JSON.stringify(lorebooks));
  if (isAuthenticated()) bunnyClient.deleteLorebook(id).catch(console.warn);
}

// --- Settings ---
export function getSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return {
      apiKey: '',
      openrouterApiKey: '',
      provider: 'xai',
      defaultModel: 'grok-3-latest',
      temperature: 0.85,
      maxTokens: 6000,
      theme: DEFAULT_THEME_ID,
      globalSystemPrompt: '',
      loreImportanceThreshold: 5,
      autoInjectLore: true,
    };
  }
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (data) {
    return JSON.parse(data);
  }
  return {
    apiKey: '',
    openrouterApiKey: '',
    provider: 'xai',
    defaultModel: 'grok-3-latest',
    temperature: 0.85,
    maxTokens: 6000,
    theme: DEFAULT_THEME_ID,
    globalSystemPrompt: '',
    loreImportanceThreshold: 5,
    autoInjectLore: true,
  };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('settings-updated'));
  }
  if (isAuthenticated()) bunnyClient.saveSettings(settings).catch(console.warn);
}

// --- Utilities ---
export function exportCharacter(character: Character): string {
  return JSON.stringify(character, null, 2);
}

/**
 * Export character as interactive HTML profile
 * Includes character info, gallery, and chat nodes (read-only)
 */
export async function exportCharacterHTML(
  character: Character, 
  galleryItems: any[], 
  chatNodes: ChatNode[]
): Promise<string> {
  // Convert gallery items to base64 for embedding
  const embeddedGallery = await Promise.all(
    galleryItems.map(async (item) => {
      if (item.type === 'embed') {
        return { ...item, embedded: true };
      }
      if (item.url) {
        try {
          const response = await fetch(item.url);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          return { ...item, url: base64, embedded: true };
        } catch (err) {
          return { ...item, embedded: false };
        }
      }
      return item;
    })
  );

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${character.name} - Character Profile</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #e2e8f0;
      line-height: 1.6;
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
      padding: 40px;
      text-align: center;
      position: relative;
    }
    .avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid white;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    .tabs {
      display: flex;
      background: rgba(30, 41, 59, 0.8);
      border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    }
    .tab {
      flex: 1;
      padding: 16px 24px;
      text-align: center;
      cursor: pointer;
      border: none;
      background: transparent;
      color: #94a3b8;
      font-size: 16px;
      font-weight: 600;
      transition: all 0.3s;
      border-bottom: 3px solid transparent;
    }
    .tab:hover { color: #06b6d4; }
    .tab.active {
      color: #06b6d4;
      border-bottom-color: #06b6d4;
      background: rgba(6, 182, 212, 0.1);
    }
    .content {
      padding: 40px;
      display: none;
    }
    .content.active { display: block; }
    .info-grid {
      display: grid;
      gap: 24px;
    }
    .info-card {
      background: rgba(30, 41, 59, 0.5);
      padding: 24px;
      border-radius: 16px;
      border: 1px solid rgba(148, 163, 184, 0.1);
    }
    .info-card h3 {
      color: #06b6d4;
      margin-bottom: 12px;
      font-size: 1.2em;
    }
    .info-card p {
      color: #cbd5e1;
      white-space: pre-wrap;
    }
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }
    .gallery-item {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.3s;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(148, 163, 184, 0.1);
    }
    .gallery-item:hover { transform: scale(1.05); }
    .gallery-item img, .gallery-item video {
      width: 100%;
      height: 200px;
      object-fit: cover;
      display: block;
    }
    .gallery-item .name {
      padding: 12px;
      font-size: 14px;
      color: #e2e8f0;
      background: rgba(15, 23, 42, 0.8);
    }
    .chat-node {
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
    }
    .chat-node h3 {
      color: #06b6d4;
      margin-bottom: 16px;
      font-size: 1.3em;
    }
    .message {
      margin-bottom: 16px;
      padding: 16px;
      border-radius: 12px;
      max-width: 80%;
    }
    .message.user {
      background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
      margin-left: auto;
      color: white;
    }
    .message.assistant {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(148, 163, 184, 0.2);
    }
    .message .role {
      font-size: 12px;
      opacity: 0.8;
      margin-bottom: 8px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .message .content {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal.active { display: flex; }
    .modal-content {
      max-width: 90%;
      max-height: 90%;
      position: relative;
    }
    .modal-content img, .modal-content video {
      max-width: 100%;
      max-height: 90vh;
      border-radius: 12px;
    }
    .modal-close {
      position: absolute;
      top: -40px;
      right: 0;
      background: #06b6d4;
      color: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 24px;
      line-height: 1;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(6, 182, 212, 0.2);
      color: #06b6d4;
      border-radius: 12px;
      font-size: 12px;
      margin-right: 8px;
      margin-bottom: 8px;
    }
    .timestamp {
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
    }
    .embed-container {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%;
      height: 0;
      overflow: hidden;
    }
    .embed-container iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 12px;
    }
    .watermark {
      text-align: center;
      padding: 20px;
      color: #64748b;
      font-size: 14px;
      border-top: 1px solid rgba(148, 163, 184, 0.1);
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${character.avatar ? `<img src="${character.avatar}" alt="${character.name}" class="avatar">` : ''}
      <h1>${character.name}</h1>
      ${character.description ? `<p>${character.description}</p>` : ''}
    </div>

    <div class="tabs">
      <button class="tab active" onclick="showTab('info')">Profile</button>
      <button class="tab" onclick="showTab('gallery')">Gallery (${embeddedGallery.length})</button>
      <button class="tab" onclick="showTab('chats')">Conversations (${chatNodes.length})</button>
    </div>

    <div id="info" class="content active">
      <div class="info-grid">
        ${character.personality ? `
          <div class="info-card">
            <h3>🎭 Personality</h3>
            <p>${character.personality}</p>
          </div>
        ` : ''}
        ${character.scenario ? `
          <div class="info-card">
            <h3>📖 Scenario</h3>
            <p>${character.scenario}</p>
          </div>
        ` : ''}
        ${character.first_mes ? `
          <div class="info-card">
            <h3>💬 First Message</h3>
            <p>${character.first_mes}</p>
          </div>
        ` : ''}
        ${character.mes_example ? `
          <div class="info-card">
            <h3>💭 Example Dialogue</h3>
            <p>${character.mes_example}</p>
          </div>
        ` : ''}
        ${character.tags && character.tags.length > 0 ? `
          <div class="info-card">
            <h3>🏷️ Tags</h3>
            <div>
              ${character.tags.map(tag => `<span class="badge">${tag}</span>`).join('')}
            </div>
          </div>
        ` : ''}
        <div class="info-card">
          <h3>ℹ️ Metadata</h3>
          <p class="timestamp">Created: ${new Date(character.createdAt).toLocaleString()}</p>
          <p class="timestamp">Last Updated: ${new Date(character.updatedAt).toLocaleString()}</p>
        </div>
      </div>
    </div>

    <div id="gallery" class="content">
      ${embeddedGallery.length > 0 ? `
        <div class="gallery-grid">
          ${embeddedGallery.map((item, idx) => {
            if (item.type === 'image') {
              return `
                <div class="gallery-item" onclick="openModal(${idx})">
                  <img src="${item.url}" alt="${item.name}">
                  <div class="name">${item.name}</div>
                </div>
              `;
            } else if (item.type === 'video') {
              return `
                <div class="gallery-item" onclick="openModal(${idx})">
                  <video src="${item.url}" ${item.thumbnail ? `poster="${item.thumbnail}"` : ''}></video>
                  <div class="name">${item.name}</div>
                </div>
              `;
            } else if (item.type === 'embed') {
              return `
                <div class="info-card">
                  <h3>${item.name}</h3>
                  ${item.embedUrl ? `
                    <div class="embed-container">
                      <iframe src="${item.embedUrl}" allowfullscreen></iframe>
                    </div>
                  ` : item.embedCode ? item.embedCode : ''}
                </div>
              `;
            }
            return '';
          }).join('')}
        </div>
      ` : '<p style="text-align: center; color: #64748b; padding: 40px;">No gallery items</p>'}
    </div>

    <div id="chats" class="content">
      ${chatNodes.length > 0 ? chatNodes.map(node => `
        <div class="chat-node">
          <h3>${node.title || 'Untitled Conversation'}</h3>
          <p class="timestamp">Created: ${new Date(node.createdAt).toLocaleString()}</p>
          <div style="margin-top: 20px;">
            ${node.messages.map(msg => `
              <div class="message ${msg.role}">
                <div class="role">${msg.role === 'user' ? 'User' : character.name}</div>
                <div class="content">${msg.content}</div>
                <div class="timestamp">${new Date(msg.timestamp).toLocaleString()}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('') : '<p style="text-align: center; color: #64748b; padding: 40px;">No conversations yet</p>'}
    </div>

    <div class="watermark">
      <p>Created with xKoda • ${new Date().toLocaleDateString()}</p>
      <p style="font-size: 12px; margin-top: 8px;">This is a read-only character profile export</p>
    </div>
  </div>

  <div id="modal" class="modal" onclick="closeModal()">
    <div class="modal-content" onclick="event.stopPropagation()">
      <button class="modal-close" onclick="closeModal()">✕</button>
      <div id="modal-body"></div>
    </div>
  </div>

  <script>
    const galleryData = ${JSON.stringify(embeddedGallery)};

    function showTab(tabName) {
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.content').forEach(content => content.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById(tabName).classList.add('active');
    }

    function openModal(index) {
      const item = galleryData[index];
      const modal = document.getElementById('modal');
      const modalBody = document.getElementById('modal-body');
      
      if (item.type === 'image') {
        modalBody.innerHTML = \`<img src="\${item.url}" alt="\${item.name}">\`;
      } else if (item.type === 'video') {
        modalBody.innerHTML = \`<video src="\${item.url}" controls autoplay style="max-width: 100%; max-height: 90vh;"></video>\`;
      }
      
      modal.classList.add('active');
    }

    function closeModal() {
      document.getElementById('modal').classList.remove('active');
      document.getElementById('modal-body').innerHTML = '';
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  </script>
</body>
</html>`;

  return html;
}

/**
 * Universal character import function
 * Supports multiple formats:
 * - TavernAI V1 (char_name, char_persona, etc.)
 * - TavernAI V2 (spec v2 with data object)
 * - CharacterAI format
 * - SillyTavern format
 * - Agnai format
 * - Native xKoda format
 * - Any custom JSON with character data
 */
/**
 * Attempts to fix common JSON formatting issues
 * - Removes trailing commas
 * - Adds missing quotes around keys
 * - Fixes single quotes to double quotes
 * - Removes comments
 * - Handles unquoted string values
 * - Extracts key-value pairs from completely broken input as a last resort
 */
function attemptJSONFix(jsonString: string): string {
  let fixed = jsonString;
  
  // Remove C-style comments (// and /* */)
  fixed = fixed.replace(/\/\/.*$/gm, '');
  fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Replace single quotes with double quotes (but not within strings)
  fixed = fixed.replace(/'/g, '"');
  
  // Remove trailing commas before closing braces/brackets
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
  
  // Add quotes around unquoted keys
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
  
  // Fix missing commas between properties (basic case)
  fixed = fixed.replace(/("\s*)\s+"/g, '$1, "');
  fixed = fixed.replace(/(\d)\s+"/g, '$1, "');
  fixed = fixed.replace(/(true|false|null)\s+"/g, '$1, "');
  
  // Remove multiple commas
  fixed = fixed.replace(/,+/g, ',');
  
  // Try to fix common typos
  fixed = fixed.replace(/:\s*undefined/g, ': null');
  fixed = fixed.replace(/:\s*NaN/g, ': null');
  
  return fixed.trim();
}

/**
 * Deep-scan an object tree for values matching known character field names.
 * Works on any shape of JSON — nested, flat, wrapped in arrays, etc.
 */
function deepScanForFields(obj: any, visited = new WeakSet()): Record<string, any> {
  const found: Record<string, any> = {};
  if (!obj || typeof obj !== 'object') return found;
  if (visited.has(obj)) return found;
  visited.add(obj);

  // All field names we want to find, mapped to our canonical key
  const FIELD_MAP: Record<string, string> = {
    // name
    name: 'name', char_name: 'name', character_name: 'name', characterName: 'name',
    displayName: 'name', display_name: 'name', title: '_title',
    // description
    description: 'description', desc: 'description', bio: 'description',
    char_persona: 'description', about: 'description', summary: 'description',
    // personality
    personality: 'personality', persona: 'personality', traits: 'personality',
    character_traits: 'personality',
    // scenario
    scenario: 'scenario', world_scenario: 'scenario', context: 'scenario',
    setting: 'scenario', world: 'scenario', background: 'scenario',
    // first_mes
    first_mes: 'first_mes', first_message: 'first_mes', firstMessage: 'first_mes',
    greeting: 'first_mes', char_greeting: 'first_mes', intro: 'first_mes',
    opening: 'first_mes', opening_message: 'first_mes',
    // mes_example
    mes_example: 'mes_example', example_dialogue: 'mes_example',
    example_messages: 'mes_example', examples: 'mes_example',
    sampleChat: 'mes_example', sample_chat: 'mes_example',
    example_dialog: 'mes_example', dialogue_examples: 'mes_example',
    // avatar
    avatar: 'avatar', image: 'avatar', profile_pic: 'avatar',
    icon: 'avatar', picture: 'avatar', char_avatar: 'avatar',
    profile_image: 'avatar', thumbnail: 'avatar',
    // tags
    tags: 'tags', categories: 'tags', labels: 'tags',
    // gallery
    gallery: 'gallery', images: 'gallery',
    // lorebooks
    attachedLorebooks: 'attachedLorebooks', lorebooks: 'attachedLorebooks',
    character_book: 'attachedLorebooks',
  };

  const processValue = (key: string, value: any) => {
    const lowerKey = key.toLowerCase();
    // Find matching canonical field (case-insensitive)
    let canonical: string | undefined;
    for (const [fieldName, target] of Object.entries(FIELD_MAP)) {
      if (lowerKey === fieldName.toLowerCase()) {
        canonical = target;
        break;
      }
    }
    if (!canonical) return;

    // Only keep the first (shallowest) value found for each canonical field
    if (found[canonical] !== undefined) return;

    if (typeof value === 'string' && value.trim()) {
      found[canonical] = value.trim();
    } else if (Array.isArray(value) && value.length > 0) {
      found[canonical] = value;
    } else if (typeof value === 'object' && value !== null) {
      // For objects like character_book, store as-is
      found[canonical] = value;
    }
  };

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const sub = deepScanForFields(item, visited);
      for (const [k, v] of Object.entries(sub)) {
        if (found[k] === undefined) found[k] = v;
      }
    }
  } else {
    // Process own keys first (shallow), then recurse (deep)
    for (const [key, value] of Object.entries(obj)) {
      processValue(key, value);
    }
    // Recurse into nested objects for anything not yet found
    for (const [, value] of Object.entries(obj)) {
      if (value && typeof value === 'object') {
        const sub = deepScanForFields(value, visited);
        for (const [k, v] of Object.entries(sub)) {
          if (found[k] === undefined) found[k] = v;
        }
      }
    }
  }

  return found;
}

/**
 * Last-resort: regex-extract "key": "value" pairs from raw text
 * when JSON.parse fails completely.
 */
function extractFieldsFromBrokenText(text: string): Record<string, string> {
  const found: Record<string, string> = {};
  // Match "key" : "value" (possibly with single quotes, loose spacing)
  const pattern = /['"]?(\w+)['"]?\s*[:=]\s*['"]([^'"]{1,10000})['"]/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (value && !found[key]) {
      found[key] = value;
    }
  }
  return found;
}

/**
 * Forgiving JSON parser: tries multiple strategies and never gives up
 * unless the input is truly empty.
 */
function forgivingParse(jsonString: string): any {
  // 1. Direct parse
  try { return JSON.parse(jsonString); } catch {}

  // 2. Fix common issues
  try { return JSON.parse(attemptJSONFix(jsonString)); } catch {}

  // 3. Aggressive cleaning
  try {
    let aggressive = attemptJSONFix(jsonString);
    aggressive = aggressive.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    if (!aggressive.trim().startsWith('{') && !aggressive.trim().startsWith('[')) {
      aggressive = '{' + aggressive + '}';
    }
    return JSON.parse(aggressive);
  } catch {}

  // 4. Try extracting just the first {...} or [...] block
  try {
    const braceMatch = jsonString.match(/\{[\s\S]*\}/);
    if (braceMatch) return JSON.parse(attemptJSONFix(braceMatch[0]));
  } catch {}
  try {
    const bracketMatch = jsonString.match(/\[[\s\S]*\]/);
    if (bracketMatch) return JSON.parse(attemptJSONFix(bracketMatch[0]));
  } catch {}

  // 5. All JSON parsing failed — return null so callers use regex fallback
  return null;
}

export function importCharacter(jsonString: string): Character {
  // --- Phase 1: Parse (never throws) ---
  const raw = forgivingParse(jsonString);

  // --- Phase 2: Extract fields ---
  let fields: Record<string, any> = {};

  if (raw !== null && typeof raw === 'object') {
    // Unwrap TavernAI V2 wrapper
    let root = raw;
    if (raw.spec === 'chara_card_v2' || raw.spec_version === '2.0') {
      root = raw.data || raw;
    }

    // Deep-scan the entire tree for known field names
    fields = deepScanForFields(root);

    // Also pull extensions/metadata if present
    if (!fields.data) {
      const data = root.extensions || root.metadata;
      if (data && typeof data === 'object') fields.data = data;
    }
  }

  // If JSON parsing totally failed, try regex extraction from raw text
  if (raw === null || Object.keys(fields).length === 0) {
    console.warn('JSON parsing failed — falling back to regex field extraction');
    const regexFields = extractFieldsFromBrokenText(jsonString);

    // Map regex-extracted lowercase keys to our canonical fields
    const REGEX_MAP: Record<string, string> = {
      name: 'name', char_name: 'name', character_name: 'name',
      description: 'description', desc: 'description', bio: 'description',
      personality: 'personality', persona: 'personality', traits: 'personality',
      scenario: 'scenario', world_scenario: 'scenario', context: 'scenario',
      setting: 'scenario', world: 'scenario', background: 'scenario',
      first_mes: 'first_mes', first_message: 'first_mes', greeting: 'first_mes',
      char_greeting: 'first_mes', intro: 'first_mes',
      mes_example: 'mes_example', example_dialogue: 'mes_example',
      samplechat: 'mes_example', sample_chat: 'mes_example',
      avatar: 'avatar', image: 'avatar', profile_pic: 'avatar',
    };

    for (const [rawKey, value] of Object.entries(regexFields)) {
      const canonical = REGEX_MAP[rawKey];
      if (canonical && !fields[canonical]) {
        fields[canonical] = value;
      }
    }
  }

  // Resolve the _title vs name ambiguity (title is only used if no name found)
  if (!fields.name && fields._title) {
    fields.name = fields._title;
  }

  // Convert tags/gallery from comma-separated strings if necessary
  if (typeof fields.tags === 'string') {
    fields.tags = fields.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
  }
  if (typeof fields.gallery === 'string') {
    fields.gallery = fields.gallery.split(',').map((t: string) => t.trim()).filter(Boolean);
  }

  // --- Phase 3: Build character (always succeeds) ---
  const character: Character = {
    id: generateId(),
    name: fields.name || 'Unnamed Character',
    description: fields.description || '',
    personality: fields.personality || fields.description || '',
    scenario: fields.scenario || '',
    first_mes: fields.first_mes || '',
    mes_example: fields.mes_example || '',
    avatar: fields.avatar || undefined,
    tags: Array.isArray(fields.tags) ? fields.tags : [],
    gallery: Array.isArray(fields.gallery) ? fields.gallery : [],
    attachedLorebooks: Array.isArray(fields.attachedLorebooks) ? fields.attachedLorebooks : [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    data: fields.data || {},
  };

  if (!character.personality && character.description) {
    character.personality = character.description;
  }

  console.log(`Character imported: "${character.name}" — fields found: ${Object.keys(fields).filter(k => fields[k]).join(', ')}`);
  return character;
}

export function exportLorebook(lorebook: Lorebook): string {
  return JSON.stringify(lorebook, null, 2);
}

/**
 * Universal lorebook import function — forgiving parser
 * Supports multiple formats:
 * - TavernAI character books
 * - SillyTavern lorebooks
 * - World Info formats
 * - Native xKoda format
 * Never throws — always returns a valid Lorebook.
 */
export function importLorebook(jsonString: string): Lorebook {
  const raw = forgivingParse(jsonString);

  // Helper functions
  const getString = (obj: any, ...keys: string[]): string => {
    if (!obj || typeof obj !== 'object') return '';
    for (const key of keys) {
      if (obj[key] && typeof obj[key] === 'string') {
        return obj[key].trim();
      }
    }
    return '';
  };

  const getArray = (obj: any, ...keys: string[]): any[] => {
    if (!obj || typeof obj !== 'object') return [];
    for (const key of keys) {
      if (Array.isArray(obj[key])) {
        return obj[key];
      }
    }
    return [];
  };

  // Parse entries from various formats
  const parseEntries = (entriesData: any[]): string[] => {
    return entriesData.map(entry => {
      const loreEntry: LoreEntry = {
        id: generateId(),
        name: getString(entry, 'name', 'key', 'title', 'keyword') || 'Entry',
        content: getString(entry, 'content', 'text', 'value', 'description', 'entry'),
        keys: Array.isArray(entry.keys) ? entry.keys :
              Array.isArray(entry.keywords) ? entry.keywords :
              Array.isArray(entry.triggers) ? entry.triggers :
              entry.key ? [entry.key] : [],
        category: entry.category || 'other',
        importance: typeof entry.importance === 'number' ? entry.importance :
                   typeof entry.priority === 'number' ? entry.priority :
                   typeof entry.weight === 'number' ? entry.weight : 5,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      saveLoreEntry(loreEntry);
      return loreEntry.id;
    });
  };

  let entryIds: string[] = [];
  let bookName = '';
  let bookDescription = '';

  if (raw !== null && typeof raw === 'object') {
    // Detect format
    if (raw.entries && Array.isArray(raw.entries)) {
      entryIds = parseEntries(raw.entries);
      bookName = getString(raw, 'name', 'title', 'book_name');
      bookDescription = getString(raw, 'description', 'desc', 'about');
    } else if (raw.character_book || raw.characterBook) {
      const book = raw.character_book || raw.characterBook;
      const entries = getArray(book, 'entries', 'items');
      entryIds = parseEntries(entries);
      bookName = getString(book, 'name', 'title');
      bookDescription = getString(book, 'description', 'desc');
    } else if (raw.worldInfo) {
      const entries = getArray(raw.worldInfo, 'entries', 'items');
      entryIds = parseEntries(entries);
      bookName = getString(raw, 'name', 'title', 'worldName');
      bookDescription = getString(raw, 'description', 'desc');
    } else if (Array.isArray(raw)) {
      entryIds = parseEntries(raw);
      bookName = 'Imported Lorebook';
    } else {
      // Try to find any entries-like array in the object
      const possibleEntries = Object.values(raw).find(val => Array.isArray(val));
      if (possibleEntries && Array.isArray(possibleEntries)) {
        entryIds = parseEntries(possibleEntries);
      }
      bookName = getString(raw, 'name', 'title') || 'Imported Lorebook';
      bookDescription = getString(raw, 'description', 'desc');
    }
  } else {
    // JSON completely unreadable — create empty lorebook
    console.warn('Lorebook JSON unparseable — importing as empty lorebook');
  }

  const lorebook: Lorebook = {
    id: generateId(),
    name: bookName || 'Imported Lorebook',
    description: bookDescription || 'Imported from external format',
    entries: entryIds,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  console.log(`Lorebook imported: "${lorebook.name}" — ${entryIds.length} entries`);
  return lorebook;
}

export function exportLoreEntry(entry: LoreEntry): string {
  return JSON.stringify(entry, null, 2);
}

/**
 * Universal lore entry import — forgiving parser
 * Never throws — always returns a valid LoreEntry.
 */
export function importLoreEntry(jsonString: string): LoreEntry {
  const raw = forgivingParse(jsonString);

  const getString = (obj: any, ...keys: string[]): string => {
    if (!obj || typeof obj !== 'object') return '';
    for (const key of keys) {
      if (obj[key] && typeof obj[key] === 'string') {
        return obj[key].trim();
      }
    }
    return '';
  };

  let name = '';
  let content = '';
  let keys: string[] = [];
  let category: LoreEntry['category'] = 'other';
  let importance = 5;

  const coerceCategory = (value: unknown): LoreEntry['category'] => {
    switch (value) {
      case 'character':
      case 'location':
      case 'event':
      case 'item':
      case 'concept':
      case 'other':
        return value;
      default:
        return 'other';
    }
  };

  if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    // Deep-scan for lore-entry-like fields
    name = getString(raw, 'name', 'key', 'title', 'keyword') || 'Entry';
    content = getString(raw, 'content', 'text', 'value', 'description', 'entry');
    keys = Array.isArray(raw.keys) ? raw.keys :
           Array.isArray(raw.keywords) ? raw.keywords :
           Array.isArray(raw.triggers) ? raw.triggers :
           raw.key ? [raw.key] : [];
    category = coerceCategory(raw.category);
    importance = typeof raw.importance === 'number' ? raw.importance :
                typeof raw.priority === 'number' ? raw.priority :
                typeof raw.weight === 'number' ? raw.weight : 5;
  } else if (raw === null) {
    // Try regex extraction
    const regexFields = extractFieldsFromBrokenText(jsonString);
    name = regexFields['name'] || regexFields['title'] || regexFields['key'] || 'Entry';
    content = regexFields['content'] || regexFields['text'] || regexFields['description'] || '';
    if (regexFields['category']) category = coerceCategory(regexFields['category']);
  }

  const entry: LoreEntry = {
    id: generateId(),
    name: name || 'Entry',
    content,
    keys,
    category,
    importance,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  console.log(`Lore entry imported: "${entry.name}"`);
  return entry;
}
