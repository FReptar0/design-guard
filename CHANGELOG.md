# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] - 2026-04-10

### Added
- Multi-framework build support: `--framework static|astro|nextjs` on `forge build`
- Framework adapters: StaticAdapter (HTML + nav injection), AstroAdapter (MCP build_site), NextjsAdapter (App Router + static export)
- Live preview: `forge preview` command, `--preview` flag on `forge generate`
- Preview in TUI: new menu item and Dashboard quick action
- `/forge-preview` slash command for inline image preview via MCP
- Default framework stored in `.forgerc.json`
- 17 new tests (11 adapter + 6 preview), 38 total

### Changed
- README redesigned with badges, feature table, ASCII workflow diagram, and numbered quick start
- `forge build` refactored to use adapter pattern
- `forge init` now sets default framework and logs it
- `/forge-generate` slash command updated with preview step after generation

## [0.1.0] - 2026-04-09

### Added
- CLI framework with `forge` binary (init, design, generate, build, sync, research, quota commands)
- MCP client for Google Stitch API integration
- DESIGN.md template generator with 8-section spec
- Prompt builder with zoom-out-zoom-in framework
- Prompt guardrails (length, multi-screen, vagueness detection)
- Monthly quota tracking for Flash and Pro models
- Auto-research module (crawler, differ, updater) for Stitch updates
- Interactive TUI with Dashboard, Prompt Builder, and Design Editor
- Claude Code slash commands (/forge-design, /forge-generate, /forge-build, /forge-research, /forge-sync)
- Guided workflow system (redesign, new-app)
- 23 unit and integration tests with fixtures
