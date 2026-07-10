# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

Responder siempre en español en este proyecto.

## Project state

Arkanoid game, HTML/CSS/JS only, no libs/frameworks. MVP implementado (`index.html`, `main.js`, `levels.js`, `style.css`). Assets:

- `assets/spritesheet-breakout.png` — sprite atlas
- `assets/spritesheet.js` — sprite loader/drawer helpers (`loadSpritesheet`, `drawSprite`, `drawFrame`), defines `SPRITES` (paddle/ball/blocks by color) and `EXPLOSION_FRAMES` per color
- `assets/sounds/*.mp3` — ball-bounce, break-sound

No package.json, no build/test/lint commands — plain HTML/CSS/JS servido directo en navegador (sin bundler).

Specs implementadas hasta ahora (ver `specs/`): `01-arkanoid-mvp`, `02-explosion-animation-mejora`, `03-progresion-niveles`, `04-formas-geometricas-5-niveles`.

## Spec-driven workflow (required for new features)

Este repo usa un flujo de dos comandos en vez de feature work ad-hoc. Skills viven en `.agents/skills/` (espejadas en `.claude/skills/`, mismo contenido).

### `/spec <descripción>` (`.agents/skills/spec/SKILL.md`)

Diseña el spec, nunca escribe código. Corre en 4 fases estrictas:

1. **Contexto** — lee `CLAUDE.md`/`AGENTS.md`/`GEMINI.md`/`README.md`, lista `specs/` existentes, lee las 2 specs más recientes para adoptar convenciones.
2. **Clarificación** — pregunta en bloques de 3-5 (scope, data, integración, persistencia, UX/estados, riesgos, decisiones cerradas). No avanza hasta poder responder: qué archivos cambian, cuál es el primer/último paso ejecutable, cómo se verifica que está terminado.
3. **Desarrollo sección por sección** (sigue `.agents/skills/spec/template.md`), confirmando cada una antes de la siguiente: Header (estado/dependencias/fecha/objetivo en una frase) → Scope (in / out of scope) → Data model (opcional si no aplica) → Implementation plan (pasos numerados, cada uno deja el sistema funcional) → Acceptance criteria (checklist booleano) → Decisiones tomadas y descartadas → Riesgos (opcional).
4. **Guardado** — siguiente número secuencial + slug corto, confirma nombre con el usuario, guarda en `specs/NN-slug.md` con estado `Draft` (o `Borrador`).

Estados válidos del header (`**Status:**` / `**Estado:**`): `Draft`/`Borrador`, `In review`/`En revisión`, `Approved`/`Aprobado`, `Implemented`/`Implementado`, `Obsolete`/`Obsoleto`. Este repo usa las etiquetas en español (ver specs existentes).

### `/spec-impl <NN-slug>` (`.agents/skills/spec-impl/SKILL.md`)

Implementa solo specs en estado `Approved`/`Aprobado` (o equivalente en cualquier idioma). Con cualquier otro estado, se detiene y muestra mensaje de error — no ofrece alternativas. Crea rama git `spec-NN-slug` (controlado por `specs/.spec-config.yml`, `AutoCreateBranch: true` por default), luego implementa el plan paso a paso, pausando tras cada paso para revisión de diff.

Cuando pidan construir features del juego, preferir `/spec` primero antes de escribir código directo, salvo que el usuario pida explícitamente un cambio rápido/directo.
