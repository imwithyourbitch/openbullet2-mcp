# OpenBullet 2 MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >= 18](https://img.shields.io/badge/Node.js->=18.0.0-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)](https://www.typescriptlang.org/)
[![MCP Protocol](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-purple)](https://modelcontextprotocol.io/)

A powerful **Model Context Protocol (MCP) server** for [OpenBullet 2](https://github.com/openbullet/OpenBullet2) that enables AI coding assistants to interact with OpenBullet 2 instances through natural language.

**Connect your favorite AI IDE** (Cursor, Claude Code, Cline, Windsurf) directly to OpenBullet 2 for intelligent automation, configuration generation, and job management.

## Why Use This?

- **AI-Native Integration** — Write and manage OpenBullet 2 configs using natural language through your favorite AI IDE
- **Complete API Coverage** — 30+ tools covering server management, configs, jobs, hits, proxies, wordlists, and more
- **Built-in LoliCode Reference** — AI assistants have comprehensive syntax documentation to write correct configs automatically
- **Zero Configuration for Basic Use** — Works with default OpenBullet 2 installations
- **Multi-IDE Support** — Compatible with Cursor, Claude Code, Cline, Windsurf, and any MCP-compliant client

## Quick Start

### 1. Prerequisites

- Node.js >= 18.0.0
- OpenBullet 2 Web instance (running on localhost:5000 by default)

### 2. Installation

```bash
git clone https://github.com/imwithyourbitch/openbullet2-mcp.git
cd openbullet2-mcp
npm install
npm run build
```

### 3. Configure Your AI IDE

#### Cursor / Claude Code
Add to your IDE's MCP configuration file:

```json
{
  "mcpServers": {
    "openbullet2": {
      "command": "node",
      "args": ["/absolute/path/to/openbullet2-mcp/dist/index.js"],
      "env": {
        "OB2_URL": "http://localhost:5000",
        "OB2_USERNAME": "admin",
        "OB2_PASSWORD": "admin"
      }
    }
  }
}
```

#### Cline
Add the server to your Cline MCP configuration with the same structure above.

#### Windsurf / Other MCP Clients
Refer to your IDE's MCP setup documentation and use the configuration above.

### 4. Start Using It

Once configured, you can ask your AI assistant:
- *"Create an OpenBullet 2 config that checks email:password combos against Gmail"*
- *"Start a proxycheck job and show me the results"*
- *"List all my wordlists and create a new one with 1000 entries"*
- *"Debug this config — it's not parsing correctly"*

## Features

### Core Capabilities

- **LoliCode Syntax Reference** — Comprehensive documentation built-in so AI assistants know correct block syntax, setting values, and config structure
- **MCP Resources** — Exposes syntax reference, quick cheat-sheet, and config creation guide as MCP resources
- **MCP Prompts** — Pre-built prompts for writing configs, editing configs, and full workflows

### Server Management
- Health checks and server info
- Collection statistics
- Announcements and update checks
- System, environment, RuriLib, and OpenBullet settings

### Config Management
- Create, read, update, delete LoliCode/C# configs
- Debug and test configs
- Convert between LoliCode, C#, and Stack formats
- Get block descriptors and code snippets
- Full LoliCode syntax reference access

### Job Management
- Create MultiRun and ProxyCheck jobs
- Start, stop, pause, resume, and abort jobs
- Change bot count dynamically
- View detailed bot statistics and status

### Hit Management
- List and filter hits with multiple formats
- Delete hits and purge duplicates
- Send hits to recheck queue
- Export hits in various formats

### Proxy Management
- List and add proxies
- Manage proxy groups
- Delete and move proxies
- Import proxies from remote URLs

### Wordlist Management
- List, preview, and create wordlists
- Update and delete wordlists
- Monitor wordlist statistics

### Guest Management
- Create and delete guest user accounts
- Manage guest passwords
- Control guest access levels

### Additional Tools
- Plugin management
- Shared endpoint configuration
- Job monitoring with automated triggers
- Debug tools (garbage collection, log downloads)

## Configuration

Create a `.env` file in the project root to customize connection settings:

```env
# Required
OB2_URL=http://localhost:5000

# Optional (if your OB2 instance requires authentication)
OB2_USERNAME=admin
OB2_PASSWORD=admin
```

**Note:** If your OpenBullet 2 instance has no authentication configured, only `OB2_URL` is required.

## Project Structure

```
openbullet2-mcp/
├── src/
│   ├── index.ts                  # MCP server entry point
│   ├── config.ts                 # Environment configuration
│   ├── lolicode-reference.ts     # Comprehensive LoliCode syntax reference
│   ├── resources.ts              # MCP resources (syntax docs, guides)
│   ├── prompts.ts                # MCP prompts (config workflows)
│   ├── client/
│   │   ├── ob2-client.ts         # HTTP client with JWT authentication
│   │   └── types.ts              # OpenBullet 2 API type definitions
│   ├── tools/
│   │   ├── server.ts             # Server management tools
│   │   ├── configs.ts            # Config management + syntax reference
│   │   ├── jobs.ts               # Job management tools
│   │   ├── hits.ts                # Hit management tools
│   │   ├── proxies.ts            # Proxy management tools
│   │   ├── wordlists.ts          # Wordlist management tools
│   │   ├── guests.ts             # Guest management tools
│   │   ├── settings.ts           # Settings management tools
│   │   ├── admin.ts              # Admin tools
│   │   └── debug.ts              # Debug tools
│   └── utils/
│       └── helpers.ts            # Utility functions
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Development

```bash
# Install dependencies
npm install

# Development with hot reload
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build

# Run built version
npm start
```

## LoliCode Syntax Support

The MCP server includes comprehensive LoliCode syntax documentation so AI assistants connected to it can write correct OpenBullet 2 configs automatically.

### Access Syntax Reference

#### Via Tool
Use the `ob2_lolicode_reference` tool to get:
- Full syntax reference
- Quick cheat-sheet
- Config creation guide

#### Via MCP Resources
- `ob2://lolicode/syntax-reference` — Complete LoliCode syntax
- `ob2://lolicode/quick-reference` — Quick reference guide
- `ob2://guides/config-creation` — Step-by-step config creation

#### Via MCP Prompts
- `write-lolicode-config` — Write a new config from scratch
- `edit-lolicode-config` — Modify an existing config
- `create-config-workflow` — Full workflow for complex configs
- `lolicode-syntax-help` — Get syntax help for specific blocks

### Syntax Reference Coverage

- Block syntax (`BLOCK:Name ... ENDBLOCK`)
- Common blocks (HttpRequest, Parse, Keycheck, Regex, etc.)
- Setting value types (fixed, variable `@name`, interpolated `$"<name>"`)
- Keycheck/keychain condition syntax
- Flow control (IF/ELSE/WHILE/FOREACH/TRY/CATCH)
- Input data variables (`input.USER`, `input.PASS`, `data.SOURCE`, `data.STATUS`)
- Complete config examples with full JSON structure
- Config creation workflow (step-by-step)

## Compatible AI IDEs

- **Cursor** — Full support
- **Claude Code** — Full support
- **Cline** — Full support
- **Windsurf** — Full support
- **Any MCP-compliant client** — Supported

## Common Use Cases

### Create Email Checker Config
Ask your AI: *"Create a LoliCode config that checks email:password combos against Gmail using IMAP"*

The assistant can now:
- Write the complete config with correct LoliCode syntax
- Reference the built-in syntax guide
- Test the config before deployment
- Debug any issues

### Automate Proxy Testing
Ask your AI: *"Load my proxies, create a proxycheck job, and run it with 50 bots"*

The assistant can:
- List your existing proxies
- Create a new ProxyCheck job
- Configure bot count and settings
- Monitor job progress

### Generate Wordlists
Ask your AI: *"Create a wordlist with common passwords and upload it"*

The assistant can:
- Generate wordlist content
- Create it in OpenBullet 2
- Verify the upload

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Areas for Contribution
- Additional tools and features
- Bug fixes and improvements
- Documentation and examples
- Integration guides for other AI IDEs
- Performance optimizations

## License

MIT License — See [LICENSE](LICENSE) file for details

## Troubleshooting

### Connection Issues
```
Error: Cannot connect to OpenBullet 2
```
- Verify OpenBullet 2 is running on the configured URL
- Check `OB2_URL` environment variable
- Ensure your firewall allows the connection

### Authentication Failed
```
Error: Authentication failed
```
- Verify `OB2_USERNAME` and `OB2_PASSWORD` are correct
- If OB2 has no authentication, remove these variables from `.env`

### Tool Not Found
```
Error: Tool 'xyz' not found
```
- Ensure your IDE's MCP configuration points to the built `dist/index.js`
- Rebuild the project: `npm run build`
- Restart your IDE

## Related Resources

- [OpenBullet 2 GitHub](https://github.com/openbullet/OpenBullet2)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Cursor Documentation](https://cursor.com/)
- [Cline GitHub](https://github.com/cline/cline)

## Support & Feedback

- Open an [issue](https://github.com/imwithyourbitch/openbullet2-mcp/issues) for bug reports
- Start a [discussion](https://github.com/imwithyourbitch/openbullet2-mcp/discussions) for feature requests
- Check [existing issues](https://github.com/imwithyourbitch/openbullet2-mcp/issues) before posting

---

**Made with ❤️ for the OpenBullet and AI automation communities**
