# Heaven's Engine DrxmShells

Heaven's Engine is the focused single-character roleplay shell built on the main Blurr Drxmweave engine.

- Route: `/single/<drxmShellId>` for a saved DrxmShell.
- Legacy fallback: `/single/<characterId>` still opens the same shell surface directly for that character.
- Dashboard: use **Create DrxmShell** to mint a saved one-character engine instance and open it in a separate tab.

Each DrxmShell is locked to one character while reusing that character's chat history, gallery, info, attached lorebooks, memory compilation, model settings, and roleplay engine behavior.

To start the dev server from the repository root:

```powershell
npm run dev
```

Then open the route above. The dashboard can create multiple DrxmShells for the same or different characters.
