# Reveal.js runtime

These files are unmodified distributions from the official **Reveal.js 5.1.0**
repository, commit `6b8c64ffa8fddd9ed4bcd92bcfd37b67ba410244`.
Reveal.js is MIT licensed; see `LICENSE`.

The highlight plugin bundles **highlight.js 11.9.0**, licensed under BSD-3-Clause.
Its upstream license is preserved at `plugin/highlight/LICENSE`.

`../../tools/vendor/reveal.lock.json` records the immutable source URLs, original
byte lengths and SHA-256 checksums. Assets are self-hosted; viewing or building
the presentation does not download code from a CDN.

From the repository root:

```sh
node presentation/tools/vendor-reveal.cjs --check
node presentation/tools/vendor-reveal.cjs
```

The first command verifies the checked-in files without network access. The
second restores the exact pinned files from their official upstream commits and
verifies all downloads before writing them. Updating Reveal requires reviewing
the dependency version and replacing the lock explicitly.
