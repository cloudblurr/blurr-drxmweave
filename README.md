<p align="center">
  <h1 align="center">Ooda Muse Engine</h1>
  <p align="center">
    <strong>An advanced AI-powered roleplay platform featuring immersive character-driven narrative simulation, dynamic lore management, and multi-model support.</strong>
  </p>
  <p align="center">
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-features">Features</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-models">Models</a> •
    <a href="FEATURES.md">Full Docs</a>
  </p>
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Roleplay Engine** | Immersive third-person narrative simulation with action continuity, scene state tracking, and NPC autonomy |
| **Character Memory** | Brain system with recent responses, memory bank summaries, and compiled overview memory that persists across sessions |
| **Lore World** | Build rich worldbuilding with lorebooks, entries, and dynamic keyword-matched context injection |
| **Multi-Model Support** | xAI (Grok 3), OpenRouter (Claude, Gemini, Llama, Mistral, DeepSeek, Chimera, and more) |
| **Model Tester** | Compare up to 5 models side-by-side for roleplay quality |
| **Media Gallery** | Upload and manage images/videos per character with OracleViewer |
| **Share Profiles** | Export and share character profiles via URL with full gallery and conversation history |
| **LoreAI Builder** | AI-assisted worldbuilding through conversational lore card generation |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/oodaverse/Ooda-Muse-Engine.git
cd Ooda-Muse-Engine

# Install dependencies
npm install

# (Optional) Create environment file for API keys
echo "VITE_XAI_API_KEY=your-xai-api-key-here" > .env.local
echo "VITE_OPENROUTER_API_KEY=your-openrouter-api-key-here" >> .env.local

# Start development server
npm run dev
```

The app will be available at **`http://localhost:3008`**

### Production Build

```bash
npm run build
npm run preview
```

---

## 🔑 API Keys

| Provider | Get Your Key | Env Variable |
|----------|-------------|--------------|
| **xAI (Grok)** | [x.ai](https://x.ai) | `VITE_XAI_API_KEY` |
| **OpenRouter** | [openrouter.ai](https://openrouter.ai) | `VITE_OPENROUTER_API_KEY` |

Keys can also be set in the in-app **Settings** panel.

---

## 🤖 Models

### xAI (Direct API)

| Model | Description |
|-------|-------------|
| `grok-3-latest` | Flagship model — strong creative writing |
| `grok-3-fast` | Fast variant for quick responses |
| `grok-3-mini` | Compact and efficient |
| `grok-2-latest` | Grok 2 with strong roleplay |

### OpenRouter — Claude (Beta/Uncensored)

| Model | Description |
|-------|-------------|
| Claude Opus 4 Beta | Most powerful Claude — extended content policy (uncensored) |
| Claude Sonnet 4 Beta | Sonnet 4 via extended content policy — uncensored routing |
| Claude 3.5 Sonnet Beta | 3.5 Sonnet — uncensored extended routing |
| Claude 3.5 Haiku Beta | Fast Claude — uncensored extended routing |
| Claude 3 Opus | Classic flagship — deep narrative, creative fiction |
| Claude 3 Haiku | Fast & affordable Claude for rapid responses |

### OpenRouter — Claude (Standard)

| Model | Description |
|-------|-------------|
| Claude Opus 4 | Most capable Claude model |
| Claude Sonnet 4 | Latest Claude — strong narrative |
| Claude 3.5 Sonnet | High-quality creative writing |

### OpenRouter — Premium

| Model | Description |
|-------|-------------|
| Gemini 2.5 Flash | Massive 1M context window |
| Llama 3.3 70B / 3.1 405B | Open-source creative powerhouses |
| Mistral Large | Nuanced European model |
| DeepSeek Chat / R1 | Chain-of-thought reasoning |
| Qwen 2.5 72B | Multilingual strong writer |

### OpenRouter — Chimera (NSFW-Optimized)

| Model | Description |
|-------|-------------|
| Chimera Llama 3.1 70B | Unrestricted creative roleplay |
| Chimera Llama 3.3 70B | Enhanced NSFW capabilities |
| Chimera Mistral Large | Immersive storytelling |

### OpenRouter — Roleplay Specialized

| Model | Description |
|-------|-------------|
| Hermes 3 405B / 70B | NousResearch — fine-tuned for RP |
| MythoMax L2 13B | Classic creative fiction |
| Toppy M 7B | Community favorite uncensored |
| Dolphin Mixtral 8x7B | Unrestricted Mixtral fine-tune |

### OpenRouter — Free Tier

| Model | Context |
|-------|---------|
| Llama 3.3 70B | 131K |
| Llama 3.1 8B | 131K |
| Gemini 2.0 Flash | 1M |
| Mistral Nemo | 128K |
| Qwen 2.5 7B | 32K |
| Mythomist 7B | 32K |

---

## 🏗 Architecture

### Roleplay Engine (`services/roleplay/`)

```
┌─────────────────────────────────────────────────┐
│                 Prompt Layer Manager             │
│  System Prompt → Developer Prompt → Scene State  │
├─────────────────────────────────────────────────┤
│   Action Ledger    │   Scene State Manager       │
│   (track/resolve)  │   (location, NPCs, tension) │
├─────────────────────────────────────────────────┤
│   Response Validator   │   Memory System          │
│   (quality checks)     │   (short-term + long)    │
└─────────────────────────────────────────────────┘
```

- **Prompt Layer Manager** — Three-tier prompt architecture (System → Developer → Scene)
- **Action Ledger** — Tracks every user action as an unresolved narrative obligation
- **Scene State Manager** — Maintains persistent world state (location, NPCs, tension, escalation)
- **Response Validator** — Ensures narrative quality, anti-echo, and action resolution
- **Memory System** — Short-term scene memory + long-term persistent character memory

### Character Brain

When a conversation is **compiled**, the engine:

1. Saves the full chat history as memory chunks
2. Generates a concise AI summary of the session
3. Stores the summary in the character's memory bank
4. Regenerates the overview memory from all summaries
5. Injects this memory into future conversations automatically

### Data Storage

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Characters, Nodes, Settings | `localStorage` | Fast synchronous access |
| Gallery Media | `IndexedDB` | Binary blob storage (unlimited) |
| Character Brain | `localStorage` | Memory chunks and summaries |

---

## 📁 Project Structure

```
├── components/              # React components
│   ├── CharacterChat.tsx       # Main chat interface with memory compile
│   ├── CharacterGallery.tsx    # Character browser
│   ├── LoreAIBuilder.tsx       # AI-assisted worldbuilding
│   ├── LoreWorld.tsx           # Lorebook management
│   ├── ModelTester.tsx         # Model comparison tool
│   ├── OracleViewer.tsx        # Floating media viewer
│   └── Settings.tsx            # App configuration
├── services/                # Core services
│   ├── roleplay/               # Roleplay engine modules
│   │   ├── roleplayEngine.ts      # Main orchestrator
│   │   ├── promptLayerManager.ts  # Three-tier prompt system
│   │   ├── actionLedger.ts        # Action tracking
│   │   ├── sceneStateManager.ts   # World state persistence
│   │   ├── memorySystem.ts        # Short & long-term memory
│   │   ├── responseValidator.ts   # Output quality validation
│   │   └── integration.ts         # API integration layer
│   ├── xaiService.ts           # AI provider integration
│   ├── storage.ts              # LocalStorage interface
│   └── galleryDB.ts            # IndexedDB media storage
├── constants.ts             # Models, modes, config
├── types.ts                 # TypeScript interfaces
└── prompt.txt               # Master roleplay prompt template
```

---

## 🛠 Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 19 + Vite | Framework & build tool |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| IndexedDB (idb) | Client-side media storage |
| react-markdown + remark-gfm | Message rendering |
| Lucide React | Icons |
| Plyr | Media player |

---

## 🎮 Usage

### Creating a Character

1. Navigate to **Characters** tab
2. Click **Create Character**
3. Fill in name, personality, scenario, and first message
4. Optionally attach lorebooks for context injection

### Memory Compilation

1. After a conversation, click **Compile**
2. The engine summarizes the session and injects it into the character's brain
3. Future conversations with that character will reference this memory
4. Works cumulatively — every compiled session builds the character's experience

### Using Lorebooks

1. Go to **LoreWorld** tab → create a lorebook
2. Add entries with keywords and importance ratings (1–10)
3. Attach the lorebook to characters
4. Entries are auto-injected based on keyword matches and importance threshold

### Testing Models

1. Go to **Settings** → **Model Tester**
2. Select up to 5 models to compare
3. Enter a test prompt → compare responses side-by-side

---

## 🔒 Privacy

All data is stored locally in your browser. No data is sent to external servers except API calls to your configured AI provider (xAI or OpenRouter).

---

## 📄 License

MIT License — See [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

---

**Repository**: [github.com/oodaverse/Ooda-Muse-Engine](https://github.com/oodaverse/Ooda-Muse-Engine)  
**Email**: oodaverse@gmail.com
