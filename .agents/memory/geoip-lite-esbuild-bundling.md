---
name: geoip-lite esbuild bundling
description: geoip-lite (and similar packages that resolve data files via path.join(__dirname, ...)) must be excluded from esbuild bundling in api-server builds.
---

`geoip-lite` locates its `.dat` data files relative to its own package directory using `path.join(__dirname, ...)`. When esbuild bundles it into a single output file (e.g. `artifacts/*/build.mjs`'s `external` array), `__dirname` resolves to the bundle's own directory instead, so the data files can't be found and the app crashes at startup with `ENOENT ... /data/geoip-country.dat`.

**Why:** discovered while wiring an IP → country/city lookup into an API server; the failure only appears at runtime (after a successful build), not at typecheck/build time.

**How to apply:** any package that reads sibling files via `__dirname`/path-traversal (geoip-lite, and the same class of package already listed in the build script's `external` array, e.g. `@google-cloud/secret-manager`-style packages) should be added to that `external` list rather than left to bundle.
