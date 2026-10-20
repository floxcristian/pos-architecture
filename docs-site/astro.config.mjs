import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import { sidebar } from './content-map.mjs';
import mermaidFigures from './scripts/remark-mermaid.mjs';

export default defineConfig({
  site: 'https://presentation-gamma-rust.vercel.app',
  base: '/guide',
  trailingSlash: 'always',
  output: 'static',
  outDir: './dist',
  publicDir: './static',
  build: { inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
  markdown: { processor: unified({ remarkPlugins: [mermaidFigures] }) },
  integrations: [starlight({
    title: 'POS Platform',
    description: 'Propuesta de arquitectura corporativa, decisiones y evidencia técnica del POS multipaís.',
    locales: { root: { label: 'Español', lang: 'es' } },
    sidebar,
    customCss: ['./src/styles/custom.css'],
    components: { Footer: './src/components/DocsFooter.astro' },
    social: [{ icon: 'github', label: 'Repositorio de la propuesta', href: 'https://github.com/floxcristian/pos-architecture' }],
    tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
    expressiveCode: { themes: ['github-light', 'github-dark'] },
    pagination: true,
    credits: false,
    favicon: '/favicon.svg',
  })],
});
