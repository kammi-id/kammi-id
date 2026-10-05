# Docker CI Design

**Date:** 2026-06-03
**Status:** Approved

## Overview

Add a GitHub Actions workflow for building and pushing Docker container images to GitHub Container Registry (`ghcr.io`). Also fix `.dockerignore` to exclude all `.env` variants.

## Scope

1. Fix `.dockerignore` — exclude all `.env` files
2. Add `.github/workflows/docker.yml` — build & push workflow

Out of scope: deployment after push, multi-platform builds, self-hosted runners.

## `.dockerignore` Changes

Replace the current `.env*.local` entry with:

```
.env
.env.*
!.env.example
```

Covers: `.env`, `.env.local`, `.env.production`, `.env.staging`, etc. Exempts `.env.example` if it exists.

## Workflow: `docker.yml`

### Triggers

| Event          | Condition     | Tags produced                 |
| -------------- | ------------- | ----------------------------- |
| `push`         | branch `main` | `latest`, `sha-{7char}`       |
| `push`         | tag `v*.*.*`  | `v1.2.3`, `1.2.3`, `1.2`, `1` |
| `pull_request` | target `main` | `dev-{7char sha}`             |

### Image

`ghcr.io/kammi-id/kammi-id`

### Steps

1. `actions/checkout@v4`
2. `docker/setup-buildx-action@v3`
3. `docker/login-action@v3` — login to `ghcr.io` using `GITHUB_TOKEN` (no extra secrets needed)
4. `docker/metadata-action@v5` — generate tags per trigger rules above
5. `docker/build-push-action@v6` — build and push, with GitHub Actions layer cache (`type=gha`)

### Permissions

```yaml
permissions:
  contents: read
  packages: write
```

`packages: write` is required to push to `ghcr.io`.

### Constraints

- PRs from external forks cannot push to `ghcr.io` (GitHub restricts `GITHUB_TOKEN` write access for fork PRs). PRs from within the repo work normally.
- No build-time env vars required — all runtime vars are secrets injected at container run time.

## Relationship to Existing CI

`ci.yml` (lint + test) remains untouched. `docker.yml` runs independently with different triggers.
