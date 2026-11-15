# Repository Guidelines

## Core Operating Principles

These principles govern how an AI coding agent should operate in this repository, regardless of which tool (Claude Code, Codex, or others) is used.

1. **Response Language Discipline**: Follow this repository's working-language convention when responding to the user (for this repository, Japanese), and keep responses polite and concise. This rule governs the language the agent uses when *talking with the user* — it is a separate axis from the language this document itself is written in (English, see "Documentation Language" below), and separate from the bilingual (English/Japanese) convention that applies to README and Wiki pages.
2. **Respect for Existing Behavior**: Do not invent your own implementation or make unsupported leaps of inference. Prioritize faithfully reproducing and porting the logic of the existing implementation — the migration source, the specification, or prior commits — over introducing a novel design.
3. **Root-Cause Analysis**: When a problem or bug occurs, do not keep patching based on guesses. Always compare against the existing implementation or specification and investigate the root cause thoroughly before applying a fix.
4. **The Human Gate Is Sovereign**: Never decide on your own that it is fine to move on to the next step without an explicit response from the user to a question or confirmation request. The agent privately concluding that something is fine is not a substitute for the user confirming it — the user must obtain that assurance for themselves. Whether to proceed to the next step is always the user's exclusive prerogative. Proceeding without a response usurps that prerogative and must be treated as the equivalent of a coup — a grave violation, never a minor process slip.

### Documentation Language

This document (`AGENTS.md`) itself is written in English, independent of principle 1 above.

## Operational Rules & History

- Repository-specific operating rules for AI coding agents are recorded under `docs/superpowers/rules/`.
- A translated index of this repository's pre-2026 development history (proposals and records originally written in the OpenSpec workflow) is available at `docs/history/openspec-legacy-index.md`, with original documents preserved under `docs/history/openspec-legacy/`.

## Project Structure & Module Organization

Core viewer logic lives in `src/` (`index.ts`, `maplat_control.ts`, `ui_init.ts`, `ui_marker.ts`, `ui_utils.ts`, `function.ts`, `contextmenu/`, `service-worker/`, `styles/`). Legacy Node-based regression specs are under `spec/` (`*.spec.ts`, Vitest with jsdom). `demo/` and `public/` host the Vite demo playground; `pwa/` holds PWA assets. Release helper scripts (`scripts/*.js`) build the service worker and handle other release tasks; do not edit generated `dist-demo/` artifacts directly.

## Build, Test, and Development Commands

`pnpm dev` starts the demo Vite dev server together with the service-worker watcher (`concurrently "pnpm watch:sw" "vite --host"`). `pnpm build` runs a strict type check (`tsc`) and a production bundle (`BUILD_MODE=package vite build`) plus the service-worker build (`pnpm build:sw`). `pnpm build:demo` builds the demo site. `pnpm preview` serves the built demo locally. `pnpm typecheck` (`tsc --noEmit`) and `pnpm lint` (`pnpm lint:eslint && pnpm lint:prettier`) are the pre-flight checks.

## Coding Style & Naming Conventions

TypeScript with `strict: true` in `tsconfig.json`. ESLint is configured via `eslint.config.js` (`@typescript-eslint` rules, `pnpm lint:eslint` autofixes). Prettier formatting is enforced via `.prettierrc` (double quotes, 80-char width, no trailing commas); run `pnpm lint:prettier` to reformat. Run `pnpm lint` (both) before committing.

## Testing Guidelines

Vitest is the test runner (`pnpm test`, jsdom environment). Tests live in `spec/` as `*.spec.ts` files (e.g. `ui_utils.spec.ts`, `translate.spec.ts`, `locales.spec.ts`); mirror this naming when adding new suites.

## UI Wording & Glossary

All 11 UI locales (`assets/locales/*/translation.json`) are checked against `docs/i18n/maplat-glossary.json` by `node scripts/maplat-glossary-check.mjs` (`pnpm smoke:maplat-glossary`). CI also runs `node scripts/maplat-glossary-check-smoke.mjs`. `docs/i18n/maplat-glossary.md` is the generated human-readable list.

- Before designing new UI text, look up the concept in `docs/i18n/maplat-glossary.md` and use its preferred term in all 11 languages. Put the concept word into the Japanese text as well: a key whose concept word appears only in English needs one omission exception per language.
- The guarded side and locale files must not change in the same pull request. The guarded side is the canonical files (`docs/i18n/maplat-glossary.json`, `maplat-glossary.exceptions.json`, `maplat-glossary.schema.json`), the checker and its fixtures (`scripts/maplat-glossary-check.mjs`, `scripts/maplat-glossary-check-smoke.mjs`), what runs them (`.github/workflows/ci.yml`), and the `smoke:maplat-glossary*` entries of `package.json`. Generated files may change together with locales.
- Regenerate `maplat-glossary.bindings.json` and `maplat-glossary.md` with `node scripts/maplat-glossary-check.mjs --write`. It never edits locales or canonical files.
- The checker covers the locale JSON files. The Web Components implementation also has built-in strings and overrides in `src/element/i18n.ts`; review duplicate wording there when changing a locale, without treating it as a second canonical glossary source.
- Concepts shared with MaplatEditor keep the editor's concept ID, preferred terms, accepted forms and former forms (`docs/i18n/editor-glossary.json` in MaplatEditor). The shared IDs are `map`, `basemap`, `attribution`, `citation`, `app`, `layer` and `viewer`; `marker` is Maplat-specific. Only the root keys and descriptions are Maplat's own.
- The checker is a copy of MaplatEditor's `scripts/editor-glossary-check.mjs`; its header names the source commit. Keep the logic identical and compare with the original when changing it. Differences (file locations, names, the guarded-side list) live in the block of constants at the top.

### Exceptions

Exceptions live in `docs/i18n/maplat-glossary.exceptions.json`. Each names one concept and one full key and matches the full text, so it expires as soon as the text changes. Globs and blanket waivers are not allowed. Use an exception only for a row that actually violates; an exception that suppresses nothing is reported as a warning.

| Type | Use when | Fields |
|---|---|---|
| `untranslated` | The value is still the English text (identical to `en`) and lacks the required form. It also expires when the `en` text changes | `concept`, `locale`, `key`, `value`, `reason` |
| `omission` | The language omits the concept word without using a different word for it | `concept`, `locale`, `key`, `value`, `reason` |
| `anchorExclusion` | The `ja` or `en` text contains the concept's anchor word but means something else, so the key must not be bound to the concept | `concept`, `key`, `ja`, `en`, `reason` |

To add a key or change text that needs a new exception, first merge a guarded-side-only pull request containing the exception, then change the locale in another pull request. A `pending-key` warning is expected until the key exists. Remove expired exceptions in a separate guarded-side-only pull request, not together with the locale edit.

Each violation is printed as `<lang> <key> <concept> <ruleId> <hit> → <preferred>`. Run the fixture suite whenever the checker changes. Reviews must reject accepted forms added only to silence violations, misuse of anchor exclusions, and unreviewed translations presented as approved.

## Commit & Pull Request Guidelines

Recent `git log` shows a mix of Conventional Commits (`fix:`, `chore:`, `docs:`) and task-ID-prefixed messages (e.g. `m15-t1:`, `c2-m3-t1:`) tied to this project's internal task tracking. Keep commits scoped to one concern; when a message is not part of a tracked task, prefer a Conventional Commits prefix. Pull requests should describe the change, note any affected viewer behavior, and confirm lint, typecheck, and tests pass locally before requesting review.

## Release & Configuration Tips

Release-related helper scripts live in `scripts/` (service-worker build/watch). When building for publication, `pnpm build` sets `BUILD_MODE=package` and verifies the generated `dist-demo/` output. Keep secrets and proprietary map coordinates out of the repository; scrub sample data under `maps/`/`tmbs/` before sharing.
