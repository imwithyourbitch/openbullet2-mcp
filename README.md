# OpenBullet 2 MCP Server

A Model Context Protocol (MCP) server for [OpenBullet 2](https://github.com/openbullet/OpenBullet2). Enables AI IDEs and CLI tools to interact with an OpenBullet 2 Web instance through natural language.

## Features

- **LoliCode Syntax Reference** - Built-in comprehensive LoliCode syntax documentation so connected AIs know the correct block syntax, setting values, and config structure
- **MCP Resources** - Exposes LoliCode reference, quick cheat-sheet, and config creation guide as MCP resources
- **MCP Prompts** - Pre-built prompts for writing configs, editing configs, and full config creation workflows
- **Server Management** - Health checks, server info, collection stats, announcements, update checks
- **Config Management** - CRUD operations, debug/test configs, convert between LoliCode/C#/Stack, block descriptors and snippets
- **Job Management** - Create MultiRun and ProxyCheck jobs, start/stop/pause/resume/abort, change bot count, view bot details
- **Hit Management** - List, filter, format, delete hits, purge duplicates, send hits to recheck
- **Proxy Management** - List, add, delete, move proxies, add from remote URL, manage proxy groups
- **Wordlist Management** - List, preview, create, update, delete wordlists
- **Guest Management** - Create, update, delete guest users, manage passwords and access
- **Settings Management** - View/update system, environment, RuriLib, and OpenBullet settings
- **Plugin Management** - List and delete plugins
- **Shared Endpoints** - Create, update, delete shared config endpoints
- **Job Monitor** - Manage triggered actions for automated job responses
- **Debug Tools** - Trigger garbage collection, download server logs

## Prerequisites

- Node.js >= 18.0.0
- OpenBullet 2 Web instance running

## Installation

```bash
git clone <repository-url>
cd openbullet2-mcp
npm install
npm run build
```

## Configuration

Create a `.env` file in the project root:

```env
OB2_URL=http://localhost:5000
OB2_USERNAME=admin
OB2_PASSWORD=admin
```

Credentials are optional. If your OB2 instance has no authentication configured, only `OB2_URL` is required.

## MCP Server Setup

Add to your AI IDE's MCP configuration:

```json
{
  "mcpServers": {
    "openbullet2": {
      "command": "node",
      "args": ["/absolute/path/to/openbullet2-mcp/dist/index.js"],
      "env": {
        "OB2_URL": "http://localhost:5000"
      }
    }
  }
}
```

This works with Cursor, Claude Code, Codex, Cline, Windsurf, and any other MCP-compatible client.

## Project Structure

```
openbullet2-mcp/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── config.ts             # Environment configuration
│   ├── lolicode-reference.ts # Comprehensive LoliCode syntax reference
│   ├── resources.ts          # MCP resources (syntax docs, guides)
│   ├── prompts.ts            # MCP prompts (config workflows)
│   ├── client/
│   │   ├── ob2-client.ts     # HTTP client with JWT auth
│   │   └── types.ts          # OB2 API DTO type definitions
│   ├── tools/
│   │   ├── server.ts         # Server management tools
│   │   ├── configs.ts        # Config management tools + syntax reference tool
│   │   ├── jobs.ts           # Job management tools
│   │   ├── hits.ts           # Hit management tools
│   │   ├── proxies.ts        # Proxy management tools
│   │   ├── wordlists.ts      # Wordlist management tools
│   │   ├── guests.ts         # Guest management tools
│   │   ├── settings.ts       # Settings management tools
│   │   ├── admin.ts          # Admin tools
│   │   └── debug.ts          # Debug tools
│   └── utils/
│       └── helpers.ts        # Utility functions
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## LoliCode Syntax Support

The MCP server includes built-in LoliCode syntax documentation so that any AI coding assistant connected to it can write correct OB2 configs. This includes:

- **`ob2_lolicode_reference` tool** — Returns the full syntax reference, quick cheat-sheet, or config creation guide on demand
- **MCP Resources** — `ob2://lolicode/syntax-reference`, `ob2://lolicode/quick-reference`, `ob2://guides/config-creation`
- **MCP Prompts** — `write-lolicode-config`, `edit-lolicode-config`, `create-config-workflow`, `lolicode-syntax-help`

The syntax reference covers:
- Block syntax (`BLOCK:Name ... ENDBLOCK`)
- All common blocks (HttpRequest, Parse, Keycheck, etc.)
- Setting value types (fixed, variable `@name`, interpolated `$"<name>"`)
- Keycheck/keychain conditions
- Flow control (IF/ELSE/WHILE/FOREACH/TRY/CATCH)
- Input data variables (`input.USER`, `input.PASS`, `data.SOURCE`, `data.STATUS`)
- Complete config examples with full JSON structure
- Config creation workflow step-by-step

## Development

```bash
npm install
npm run dev        # Development with hot reload
npm run typecheck  # Type check
npm run build      # Build for production
npm start          # Run built version
```

## License

MIT
