import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(import.meta.url);
const astroPackage = require.resolve('astro/package.json');
const astro = JSON.parse(fs.readFileSync(astroPackage, 'utf8'));
function run(file, args = []) {
  const result = spawnSync(process.execPath, [file, ...args], { cwd: root, stdio: 'inherit', windowsHide: true, env: {...process.env, ASTRO_TELEMETRY_DISABLED: '1'} });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Documentation command failed (${result.status}): ${file}`);
}
run(path.join(root, 'docs-site/scripts/prepare-content.mjs'));
run(path.resolve(path.dirname(astroPackage), typeof astro.bin === 'string' ? astro.bin : astro.bin.astro), ['build', '--root', 'docs-site']);

const output = path.join(root, 'docs-site/dist');
const scripts = new Set();
let pages = 0;
function externalize(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) externalize(file);
    else if (entry.name.endsWith('.html')) {
      let html = fs.readFileSync(file, 'utf8');
      html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (original, attributes, code) => {
        if (/\bsrc\s*=/i.test(attributes) || !code.trim() || /\btype\s*=\s*["']application\/(?:ld\+)?json["']/i.test(attributes)) return original;
        const hash = createHash('sha256').update(code).digest('hex').slice(0, 20);
        const name = `inline-${hash}.js`;
        fs.mkdirSync(path.join(output, '_astro'), { recursive: true });
        fs.writeFileSync(path.join(output, '_astro', name), code);
        scripts.add(name);
        return `<script${attributes} src="/guide/_astro/${name}"></script>`;
      });
      fs.writeFileSync(file, html);
      pages++;
    }
  }
}
externalize(output);
fs.writeFileSync(path.join(output, '.pos-docs-build'), 'Generated documentation; sources live in docs/ and docs-site/.\n');
console.log(`Documentation ready: ${pages} HTML pages; ${scripts.size} shared inline scripts externalized for the site CSP.`);
