# petroglyphs-mcp

MCP server that bridges iPad handwriting input with LLMs. Captures handwriting as PNG images and exposes them via [Model Context Protocol](https://modelcontextprotocol.io) tools and resources.

## Quick Start

```bash
npx -y petroglyphs-mcp --port 3333
```

## Setup with Claude Desktop + iPad

Both the LLM client and iPad connect to the same MCP server. Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "petroglyphs": {
      "command": "npx",
      "args": ["-y", "petroglyphs-mcp", "--port", "3333"]
    }
  }
}
```

This runs both transports simultaneously — stdio for Claude Desktop and HTTP on port 3333 for the iPad.

### Connect the iPad

1. Make sure your iPad and computer are on the **same Wi-Fi network**
2. Find your computer's local IP:
   - **Mac:** System Settings → Wi-Fi → Details → IP Address
   - **Windows:** `ipconfig` in terminal, look for IPv4 under your Wi-Fi adapter
   - **Linux:** `hostname -I` or `ip addr`
3. Open the Petroglyphs iPad app → Server → enter `http://<your-ip>:3333`
4. The connection dot turns green when connected

### Claude Desktop only (no iPad)

If you just want stdio mode without HTTP:

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

### HTTP only (standalone)

```bash
npx -y petroglyphs-mcp --port 3333
```

## CLI Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--port` | `3333` | HTTP server port |
| `--vault-path` | — | Path to Obsidian vault (enables `save_to_obsidian` tool) |
| `--export-path` | `~/Desktop` | Output directory for Excalidraw exports |
| `--max-history` | `50` | Max submissions kept in memory |

## MCP Tools

| Tool | Description |
|------|-------------|
| `get_handwriting` | Returns the latest handwriting image (base64 PNG) with metadata |
| `get_handwriting_history` | Returns the last N submissions with metadata |
| `save_to_obsidian` | Saves content as markdown to an Obsidian vault |
| `export_to_excalidraw` | Exports strokes as an Excalidraw file |
| `clear_history` | Clears all submissions from memory |

## HTTP Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/submit` | POST | Submit handwriting image + metadata |
| `/mcp` | POST | MCP Streamable HTTP transport |

## iPad App

The companion iPad app lives at [petroglyphs-app](https://github.com/surfndev/petroglyphs-app) (coming soon).

## License

MIT
