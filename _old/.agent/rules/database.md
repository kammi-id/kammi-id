---
description: Database constraints and Orm
glob: src/db/**/*, *.ts
---

# Database

We use `drizzle-orm/bun-sql`. If you find yourself reaching for `pg` or `postgres.js` drivers, you are making a mistake. Refer to `src/db/db.ts` for the singleton connection.

# Greenfield Status

This project is in active early development. You have permission to be bold. If a schema change in `src/db/schemas/` or a structural change in `src/app/` makes a task significantly cleaner, propose the change rather than trying to fit logic into a suboptimal existing structure (ask first per the File Modification Policy).
