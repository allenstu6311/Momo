# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (see `pnpm-lock.yaml`).

- `pnpm dev` — start the Vite dev server with HMR
- `pnpm build` — type-check with `vue-tsc -b`, then produce a production bundle in `dist/`
- `pnpm type-check` — run `vue-tsc --build` only (no bundle)
- `pnpm preview` — serve the built `dist/` locally

No test runner or linter is configured. `vue-tsc` is the only static-analysis gate (it runs as part of `build`).

## Architecture

Vue 3 + Vite single-page app written in TypeScript using `<script setup>` SFCs.

- Entry: `index.html` loads `src/main.ts`, which calls `createApp(App).mount('#app')`.
- `src/App.vue` is the root component; UI lives in `src/components/`.
- Global styles in `src/style.css`; component assets imported from `src/assets/` (bundled, hashed) vs. `public/` (served as-is at root, e.g. `/icons.svg`).

### TypeScript setup

Uses the standard `create-vue` project-references layout:
- `tsconfig.json` references `tsconfig.app.json` (app code under `src/`, strict) and `tsconfig.node.json` (`vite.config.ts`).
- `src/vite-env.d.ts` pulls in `vite/client` types, which cover `.vue` and static-asset imports — no hand-written `*.vue` module declarations needed.
- `moduleResolution: bundler` with `verbatimModuleSyntax` and `isolatedModules`: import types with `import type`, and SFC `<script setup>` blocks must declare `lang="ts"`.
