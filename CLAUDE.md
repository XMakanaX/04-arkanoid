# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

Responder siempre en español en este proyecto.

## Project state

Arkanoid game, HTML/CSS/JS only, no libs/frameworks. Not started yet — no game code exists (no index.html, no build tooling). Only assets present:

- `assets/spritesheet-breakout.png` — sprite atlas
- `assets/spritesheet.js` — sprite loader/drawer helpers (`loadSpritesheet`, `drawSprite`, `drawFrame`), defines `SPRITES` (paddle/ball/blocks by color) and `EXPLOSION_FRAMES` per color
- `assets/sounds/*.mp3` — ball-bounce, break-sound

No package.json, no build/test/lint commands exist yet — plain HTML/CSS/JS served directly in browser (no bundler).

## Spec-driven workflow (required for new features)

This repo uses a two-step skill workflow instead of ad-hoc feature work. Skills live in `.agents/skills/` (mirrored in `.claude/skills/`, same content).

1. **`/spec <description>`** — designs spec before any code. Asks clarifying questions in blocks, builds spec section-by-section with user confirmation, saves to `specs/NN-slug.md` in `Draft` state. Never writes code.
2. **`/spec-impl <NN-slug>`** — implements an approved spec only. Refuses unless spec state is `Approved` (or equivalent in any language). Creates git branch `spec-NN-slug`, implements plan step by step, pausing after each step for review.

Branch auto-creation is controlled by `specs/.spec-config.yml` (`AutoCreateBranch: true` by default). Neither `specs/` nor this config file exist yet — created on first `/spec` run.

When asked to build game features, prefer routing through `/spec` first rather than writing code directly, unless the user explicitly asks for a quick/direct change.
