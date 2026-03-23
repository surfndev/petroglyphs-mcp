# Petroglyphs — Product Spec v1.0

> A handwriting keyboard for AI.

---

## What this is

An open-source iPad app that captures handwriting and sends it to any LLM via MCP. Not a note-taking app. Not a whiteboard. A dedicated input device for AI — like a microphone is voice input, this is handwriting input.

**Core loop:** Write on canvas → Pick a combo → Tap to cast → Clear → Repeat

---

## Architecture

### Components

| Component | Tech | Role |
|-----------|------|------|
| iPad app | SwiftUI + PencilKit | Canvas + combo spinner |
| MCP server | TypeScript + @modelcontextprotocol/sdk | Bridge between iPad and LLM |
| LLM client | Claude Desktop, ChatGPT, Cursor, etc. | Where AI responds |

### Data flow

1. User writes on iPad, selects a combo, taps cast
2. iPad sends PNG image + combo config to MCP server via HTTP (local Wi-Fi)
3. MCP server stores it, exposes via MCP resources
4. LLM reads image + combo prompt, responds
5. If combo has auto-action, LLM is instructed to call the tool (e.g., save to Obsidian)
6. User clears canvas, repeats

### Transport

- **stdio** — for Claude Desktop, Cursor (local)
- **Streamable HTTP** — for iPad connection + remote LLM clients

### Network

Same local Wi-Fi. Default port 3333. All local, no cloud.

---

## iPad app

### Platform
- Swift 5.9+, SwiftUI, PencilKit
- iOS 17.0+, iPad with Apple Pencil
- Landscape only (V1)

### Two pages

**Landing page:** App title, tagline, "Enter" button, three tiles (Combos, Server, Settings), connection status, footer with version/GitHub/license.

**Canvas page:** White PencilKit canvas (~85% width) framed by themed border. Combo spinner on right or left edge (handedness setting). Home button + connection dot in top corner. Native PencilKit tool picker at bottom.

### Canvas behavior
- Full Apple Pencil support (pressure, tilt, palm rejection)
- Undo/redo via PencilKit gestures
- No zoom/pan, fixed size (V1)
- White background always

### Cast (send)
- Tap active combo on spinner
- Captures canvas as PNG + stroke metadata + combo config
- HTTP POST to MCP server
- Success animation, does NOT auto-clear

### Clear
- Palm-swipe left-to-right across >70% of canvas, OR three-finger swipe as fallback
- Wipe animation (dust/sweep effect)
- Haptic feedback

### Connection
- Manual IP:port entry on first launch
- Saved in UserDefaults, auto-reconnect
- Health check ping every 10 seconds
- Queue up to 5 sends when disconnected

---

## Combo system

A combo is a preset that pairs a prompt template with the handwriting image when casting.

### Data structure

```json
{
  "id": "math-tutor",
  "name": "Math tutor",
  "icon": "📐",
  "prompt": "Review this handwritten math step by step...",
  "auto_action": null,
  "color": "#5B8FA8"
}
```

`auto_action` is optional — can specify an MCP tool to call (e.g., `save_to_obsidian` with params).

### Default combos
- Just cast (no prompt, raw send)
- Math tutor
- Vocab capture (auto: save_to_obsidian)
- Sketch critique
- Translate this
- Save to Obsidian (auto: save_to_obsidian)
- Export diagram (auto: export_to_excalidraw)

### Spinner UI
- Lives on screen edge (right default, left for left-handers)
- Scrollable/rotatable to browse combos
- Active combo is enlarged with accent highlight — tapping it casts
- Long-press any combo → quick-edit popover
- "+" slot to add new combo
- Collapsible to maximize canvas space
- Stored locally (UserDefaults or JSON file)

---

## MCP server

### Distribution
```bash
npx -y petroglyphs-mcp --port 3333
```

### Tools

| Tool | Purpose |
|------|---------|
| `get_handwriting` | Returns latest image (base64) + metadata + combo prompt |
| `get_handwriting_history` | Returns last N submissions |
| `save_to_obsidian` | Writes markdown to Obsidian vault with YAML frontmatter |
| `export_to_excalidraw` | Converts strokes to `.excalidraw` JSON (freedraw elements) |
| `clear_history` | Clears stored submissions |

### Resources

| URI | Description |
|-----|-------------|
| `slate://current` | Latest handwriting image |
| `slate://current/combo` | Combo config for latest submission |
| `slate://history` | All submissions this session |

### HTTP endpoints (for iPad)

| Endpoint | Description |
|----------|-------------|
| `POST /api/submit` | Receives PNG + metadata + combo config |
| `GET /api/health` | Health check |

### Config
- `--port` (default 3333)
- `--vault-path` (Obsidian vault directory)
- `--export-path` (Excalidraw output, default ~/Desktop)
- `--max-history` (default 50)

### Storage
In-memory only. Lost on restart. Intentional.

### Claude Desktop config
```json
{
  "mcpServers": {
    "petroglyphs": {
      "command": "npx",
      "args": ["-y", "petroglyphs-mcp"]
    }
  }
}
```

---

## Integrations

### Obsidian
`save_to_obsidian` creates `.md` files with YAML frontmatter (date, source, combo name). Optionally embeds handwriting PNG as attachment. Compatible with Dataview queries.

### Excalidraw
`export_to_excalidraw` maps PencilKit strokes to Excalidraw `freedraw` elements (points, pressures, strokeWidth). Output is standard `.excalidraw` JSON openable in Excalidraw web/desktop and the Obsidian Excalidraw plugin.

---

## Repos

Two separate repos for composability:

**petroglyphs-app** (iPad) — SwiftUI + PencilKit app with canvas, spinner, landing page

**petroglyphs-mcp** (server) — TypeScript MCP server with HTTP endpoints, Obsidian writer, Excalidraw exporter

Both: MIT license, README with setup instructions.

---

## Not in V1

- Creature/mascot/session counter
- Dark mode
- Voice dictation
- Smart math recognition (Mathpix)
- Direct API mode (no Mac needed)
- Bidirectional canvas (LLM draws back)
- Portrait orientation
- Multi-page canvas
- Cloud sync
- Community combo sharing

---

## Launch checklist

1. `npx -y petroglyphs-mcp` works
2. Claude Desktop connects, reads handwriting image
3. iPad connects to MCP server on local Wi-Fi
4. Full loop: write → combo → cast → LLM responds
5. Default combos work
6. Custom combo create/edit works
7. Clear gesture works with animation
8. `save_to_obsidian` creates valid .md files
9. `export_to_excalidraw` creates valid .excalidraw files
10. READMEs with setup instructions in both repos
11. npm published, listed on MCP directories
