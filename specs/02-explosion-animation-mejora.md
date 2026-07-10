# Mejora de animación de explosión de bloques

**Estado:** aprobado
**Depende de:** 01-arkanoid-mvp
**Fecha:** 2026-07-10
**Objetivo:** Mejorar la animación de explosión de bloques (escala creciente + fade) usando únicamente los frames del spritesheet ya existentes, sin agregar assets ni efectos nuevos.

## Alcance

**Incluido:**
- Escalado creciente del sprite de explosión: 1.0x → 1.8x del tamaño del bloque (78x16), expandiendo desde el centro del bloque
- Fade de opacidad: alpha 1.0 durante la primera mitad de la animación, luego desvanece a 0 en la segunda mitad
- Duración total de la animación: 400ms (antes 150ms)
- Selección de frame (de los 4 existentes en `EXPLOSION_FRAMES`) recalculada en proporción a la nueva duración de 400ms
- Solo usa los frames ya existentes en `assets/spritesheet.js` (`EXPLOSION_FRAMES`), transformados vía canvas (`ctx.scale`, `ctx.globalAlpha`) — sin nuevos assets ni dibujos procedurales adicionales

**Fuera de alcance (no en este spec):**
- Efectos en colisión bola-paddle o bola-pared (sin cambios, sigue igual)
- Partículas sueltas, shaders, o cualquier dibujo que no sea transformación (escala/alpha) de los frames existentes
- Cambios al sistema de puntaje, vidas, o sonido (`break-sound` sigue igual)
- Nuevos assets o modificación del spritesheet

## Modelo de datos

Sin cambios de estructura: `explosions[]` sigue siendo `{ x, y, color, start }`. Escala y alpha se calculan en `draw()` a partir de `now - start` y la nueva `EXPLOSION_DURATION`, no se agregan campos nuevos.

## Plan de implementación

1. **Actualizar duración.** Cambiar `EXPLOSION_DURATION` de 150 a 400 en `assets/spritesheet.js`. Recalcular implícitamente `EXPLOSION_FRAME_DURATION` en `main.js` (ya es `EXPLOSION_DURATION / 4`, no requiere cambio de fórmula).
2. **Calcular progreso de animación en `draw()`.** Por cada explosión activa, calcular `progress = (now - explosion.start) / EXPLOSION_DURATION` (0 a 1).
3. **Aplicar escala creciente centrada.** Calcular `scale = 1.0 + progress * 0.8` (1.0x → 1.8x). Dibujar el frame con `ctx.save()`, trasladar al centro del bloque, `ctx.scale(scale, scale)`, dibujar centrado, `ctx.restore()`.
4. **Aplicar fade en segunda mitad.** Calcular `alpha = progress < 0.5 ? 1 : 1 - (progress - 0.5) * 2`. Aplicar con `ctx.globalAlpha` antes de dibujar el frame, restaurar a 1 después.
5. **Verificación visual manual.** Romper un bloque en el navegador, confirmar que la explosión crece y se desvanece de forma visible durante 400ms antes de desaparecer del array `explosions`.

## Criterios de aceptación

- [ ] `EXPLOSION_DURATION` es 400 en `assets/spritesheet.js`
- [ ] Al romper bloque, la explosión crece visualmente desde 1.0x hasta 1.8x del tamaño del bloque a lo largo de la animación
- [ ] El escalado se expande desde el centro del bloque (no se desplaza hacia una esquina)
- [ ] La explosión mantiene opacidad completa (alpha 1.0) durante la primera mitad (0-200ms) y se desvanece a 0 durante la segunda mitad (200-400ms)
- [ ] La animación completa dura 400ms antes de que la explosión desaparezca del array `explosions`
- [ ] Los 4 frames de `EXPLOSION_FRAMES` se siguen usando y ciclan correctamente en la nueva duración de 400ms
- [ ] No se agregan sprites nuevos ni dibujos procedurales (partículas, formas) fuera de escala/alpha sobre los frames existentes
- [ ] El resto del juego (sonido, puntaje, colisiones, paddle/pared) no cambia de comportamiento

## Decisiones tomadas y descartadas

- **Solo transformaciones de canvas sobre frames existentes.** Descartado agregar partículas o dibujos procedurales nuevos — usuario pidió quedarse solo con lo que trae el spritesheet.
- **Duración 400ms (antes 150ms).** Descartado mantener 150ms — muy rápido para notar crecimiento y fade.
- **Escala 1.0x → 1.8x lineal.** Descartado un rango mayor o curva de easing — mantiene simplicidad, valor recomendado aceptado.
- **Fade solo en segunda mitad (200-400ms).** Descartado fade desde el inicio — se prefiere que la explosión se vea sólida un momento antes de desvanecer.
- **Escalado centrado en el bloque.** Descartado escalar desde esquina superior izquierda — verse como explosión real, no desplazamiento.
- **Sin cambios en efectos de paddle/pared.** Fuera de alcance, foco solo en explosión de bloques.

## Riesgos identificados

- **Overlap visual con bloques vecinos.** Al escalar hasta 1.8x, la explosión puede dibujarse sobre bloques adyacentes todavía vivos (gap de solo 2px). Mitigación: ninguna funcional necesaria — es un efecto visual esperado (halo de explosión), no afecta colisiones ni datos.
