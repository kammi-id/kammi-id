---
description: Bun-Native Environment Rules
glob: *
---

# Bun-Native

This is a strict Bun project. Always use `bun` commands (`bun run`, `bun test`, `bunx`). If you see a `node_modules` folder, ignore it; rely on the Bun runtime and its native APIs (e.g., `Bun.file`, `Bun.sql`) where applicable.
