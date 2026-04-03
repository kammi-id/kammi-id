---
description: File Modification Policy & The Surprise Rule
glob: **/*
---

# File Modification Policy (CRITICAL)

**ALL files in this project are READ-ONLY by default.**
You are strictly forbidden from creating, editing, refactoring, or deleting any files unless the developer explicitly instructs you to do so. If you discover a bug, see an opportunity for improvement, or think a file should be changed:

1. **DO NOT** make the change autonomously.
2. **DO NOT** write to the file system.
3. **DO** explain the issue and wait for the developer's explicit permission before proceeding with any file modification tools.

## The "Surprise" Rule (Priority)

If you encounter a pattern, file structure, or piece of logic in this project that surprises you or seems confusing, do NOT just work around it.

1. **Alert the developer immediately.**
2. **Propose a refactor** to make the code "self-documenting" for future agents.
3. **Once resolved, document the "why"** in this file only if a codebase change wasn't possible.
