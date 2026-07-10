# Progresión de niveles

**Estado:** aprobado
**Depende de:** 01-arkanoid-mvp, 02-explosion-animation-mejora
**Fecha:** 2026-07-10
**Objetivo:** Al romper todos los bloques de un nivel, avanzar automáticamente al siguiente (hasta 10), con patrón de bloques generado proceduralmente con semilla fija y velocidad de bola creciente por nivel.

## Alcance

**Incluido:**
- 10 niveles, avance automático al romper todos los bloques del nivel actual
- Nivel 1: grid completo 60 bloques (6x10), igual al MVP actual
- Niveles 2-10: patrón procedural con huecos aleatorios crecientes (~N*3% celdas vacías), generado con semilla determinística (mulberry32) por nivel — mismo patrón siempre para ese nivel
- Velocidad de bola crece por nivel: `velocidad = BALL_SPEED_base * (1 + 0.08 * (nivel-1))`, tope nivel 10 ≈ 1.72x
- Puntaje se mantiene acumulado entre niveles. Vidas: +1 al completar cada nivel (niveles 1-9), no se resetean, se suman a las actuales
- Overlay breve "Nivel X" al pasar de nivel (niveles 1-9), se cierra solo tras 1.5s, bola vuelve a quedar pegada al paddle
- HUD muestra nivel actual junto al puntaje ("Nivel: N")
- Al ganar nivel 10 (último): overlay de Victoria actual con puntaje final, sin vida extra

**Fuera de alcance (no en este spec):**
- Persistencia de nivel alcanzado en localStorage (siempre arranca en nivel 1)
- Selector de nivel / menú para elegir dónde empezar
- Cambios de tamaño de paddle o vidas base por nivel
- Patrones geométricos (checkerboard, diamante, etc.) — solo huecos aleatorios
- Bloques indestructibles o de más de 1 golpe (sigue fuera de alcance, heredado del MVP)

## Modelo de datos

Extiende `gameState` (sin nueva persistencia):

```js
const gameState = {
  status: 'ready' | 'playing' | 'win' | 'gameover' | 'levelup', // nuevo estado 'levelup'
  level: 1, // nuevo campo, 1-10
  score: 0,
  lives: 3,
  paddle: { x, y, w: 162, h: 14 },
  ball: { x, y, dx, dy, radius: 8, stuckToPaddle: true },
  blocks: [ { x, y, w: 78, h: 16, color: 'red', alive: true }, ... ],
};
```

Nueva función `generateBlocksForLevel(level)`: usa `mulberry32(seed)` con `seed = level` para decidir, celda por celda del grid 6x10, si queda vacía (probabilidad `level * 0.03`, nivel 1 = 0% siempre). Nivel 1 sigue usando la lógica actual (grid completo).

Nueva función `ballSpeedForLevel(level)`: `BALL_SPEED * (1 + 0.08 * (level - 1))`.

Sin cambios en localStorage (`arkanoid-highscore` sigue igual).

## Plan de implementación

1. **Implementar `mulberry32` y `generateBlocksForLevel(level)`.** Función PRNG determinística en `main.js`. `generateBlocksForLevel` reemplaza a `buildBlocks()`: nivel 1 igual que hoy (grid completo), niveles 2-10 aplican probabilidad de hueco `level * 0.03` por celda usando el PRNG con seed = level. Verificable de forma aislada (mismo nivel siempre da mismo patrón).
2. **Implementar `ballSpeedForLevel(level)`.** Función que calcula velocidad según fórmula. Usar en el lanzamiento de bola (reemplaza uso directo de `BALL_SPEED`) y donde se resetea velocidad tras perder vida.
3. **Agregar `gameState.level = 1`.** Inicializar en el estado y en `resetGame()`. HUD: agregar texto "Nivel: N" junto a "Puntaje: X" en el draw del HUD.
4. **Detectar nivel completado y avanzar.** En la condición actual `allDead` (línea ~219 de `main.js`): si `gameState.level < 10`, incrementar `gameState.level`, `gameState.lives += 1`, regenerar `gameState.blocks` con `generateBlocksForLevel`, resetear bola a `stuckToPaddle: true` con nueva velocidad, poner `gameState.status = 'levelup'`. Si `gameState.level === 10`, mantener comportamiento actual (`status = 'win'`, sin vida extra).
5. **Overlay "Nivel X" con auto-cierre.** Agregar marcado HTML (reusar `#overlay` o nuevo `#levelup-overlay` en `index.html`) mostrando "¡Nivel N!". Al entrar en `status = 'levelup'`, mostrar overlay, usar `setTimeout` de 1.5s para ocultar y poner `status = 'ready'` (bola lista para lanzar).
6. **Verificación visual manual.** Jugar rompiendo bloques hasta pasar por varios niveles, confirmar: overlay aparece y desaparece solo, velocidad de bola sube perceptiblemente, patrón de nivel 3+ tiene huecos, vida sube +1 por nivel, puntaje no se resetea, nivel 10 completado muestra Victoria normal sin vida extra.

## Criterios de aceptación

- [ ] Nivel 1 muestra grid completo de 60 bloques (6x10), igual que MVP actual
- [ ] Al romper todos los bloques de un nivel < 10, avanza automáticamente al siguiente nivel sin mostrar overlay de Victoria
- [ ] Niveles 2-10 muestran patrón con huecos (celdas sin bloque), y el mismo nivel genera siempre el mismo patrón al recargar/rejugar
- [ ] Velocidad de bola aumenta en cada nivel según `BALL_SPEED * (1 + 0.08 * (nivel-1))`, verificable nivel 1 vs nivel 10 (~1.72x)
- [ ] Puntaje NO se resetea al pasar de nivel
- [ ] Al pasar de nivel (1→9), `gameState.lives` aumenta en 1 respecto al valor que tenía antes de completar el nivel
- [ ] Al completar nivel 10, NO se suma vida extra (va directo a Victoria)
- [ ] Al pasar de nivel se muestra overlay "¡Nivel N!" que desaparece solo tras 1.5s, sin requerir click/tecla
- [ ] HUD muestra "Nivel: N" visible junto al puntaje durante el juego
- [ ] Al romper todos los bloques del nivel 10, se muestra el overlay de Victoria existente con puntaje final
- [ ] Al recargar la página (F5), el juego siempre arranca en nivel 1 (sin persistencia de nivel)
- [ ] High score en localStorage sigue funcionando igual que antes

## Decisiones tomadas y descartadas

- **Patrón procedural con huecos aleatorios, no patrones geométricos fijos.** Descartado checkerboard/diamante/marco — escala a 10 niveles sin diseñar cada patrón a mano.
- **Semilla determinística (mulberry32) por nivel.** Descartado `Math.random()` puro — mismo nivel debe verse igual siempre (rejugable, testeable).
- **Nivel 1 = grid completo, sin huecos.** Mantiene compatibilidad con MVP existente, dificultad sube gradualmente desde ahí.
- **Incremento de velocidad 8%/nivel, fórmula lineal simple.** Descartado curva exponencial o tabla manual — predecible y fácil de ajustar.
- **Overlay "Nivel X" con auto-cierre (1.5s), sin botón.** Descartado requerir click — mantiene ritmo de juego, evita fricción entre niveles.
- **+1 vida al completar cada nivel (niveles 1-9).** Decisión del usuario, reemplaza propuesta inicial de "vidas se mantienen sin cambio" — recompensa progreso.
- **Sin persistencia de nivel en localStorage.** Descartado por alcance — fuera de esta spec, siempre arranca en nivel 1.
- **Nuevo estado `gameState.status = 'levelup'`.** Descartado reusar `'win'` para transición intermedia — evita confundir lógica de overlay final con la de transición.

## Riesgos identificados

- **Nivel 10 con velocidad 1.72x puede ser injugable con paddle actual (162px).** Mitigación: ninguna funcional en esta spec — si resulta injugable en pruebas manuales, ajustar el % de incremento queda para una spec de balanceo posterior.
- **Patrón procedural con huecos podría generar nivel imposible de completar** (bloques inalcanzables por diseño de huecos, aunque en este juego los bloques no bloquean entre sí físicamente). Mitigación: ninguna necesaria — la bola rebota libremente, huecos no crean zonas inaccesibles.
- **Vidas acumulables sin tope** (10 niveles × +1 vida = hasta +9 vidas si nunca se pierde ninguna). Mitigación: ninguna — es el comportamiento deseado, sin tope máximo definido por el usuario.
