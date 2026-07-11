---
name: artifact path routing limits
description: Why literal root-level short/clean URLs (e.g. https://domain/CODE) aren't achievable for an artifact that doesn't own "/".
---

In this workspace's path-based routing model, each artifact's service is registered with specific `paths` in its `artifact.toml` (e.g. `/api`, `/s`, `/r`). An artifact cannot claim the bare root `/` if another artifact (typically the main SPA) already owns it — there's no wildcard/fallback ownership of unclaimed root-level segments for a second service.

**Why:** came up building a URL shortener where the spec asked for `https://domain/CODE` style short links; the SPA already owned `/`, so the API server couldn't also catch arbitrary root-level codes.

**How to apply:** when a spec asks for clean root-level short paths and the app already has a root-owning SPA, use a small dedicated prefix instead (e.g. `/s/:code`) added to the API artifact's `paths` array via `verifyAndReplaceArtifactToml`, and clearly flag to the user that true bare-root custom-domain links need dedicated domain/routing infra beyond this workspace.
