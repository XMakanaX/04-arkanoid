# Formas geométricas y 5 niveles

**Estado:** implementado
**Depende de:** 01-arkanoid-mvp, 02-explosion-animation-mejora, 03-progresion-niveles
**Fecha:** 2026-07-10
**Objetivo:** Reemplazar los huecos aleatorios de la progresión de niveles por 5 formas geométricas fijas y crecientes en dificultad (una por nivel), reduciendo el juego de 10 a 5 niveles con velocidad de bola y vidas extra recalibradas al mismo tope final.

## Alcance

**Incluido:**
- 5 niveles (antes 10), avance automático al romper todos los bloques del nivel actual
- Cada nivel usa una forma geométrica fija y determinística (sin PRNG, sin huecos aleatorios extra): Nivel 1 checkerboard, Nivel 2 marco/borde hueco, Nivel 3 escalera, Nivel 4 diamante, Nivel 5 pirámide invertida
- Velocidad de bola recalibrada: mismo tope final ~1.72x, repartido en 5 niveles en vez de 10 (`velocidad = BALL_SPEED * (1 + 0.18 * (nivel-1))`)
- Vidas extra recalibradas: +1 vida al completar cada nivel (niveles 1-4), tope +4 vidas (antes +9), no se resetean
- Puntaje se mantiene acumulado entre niveles (sin cambio respecto a spec 03)
- Overlay "Nivel X" con auto-cierre 1.5s (sin cambio respecto a spec 03)
- HUD "Nivel: N" (sin cambio, pero ahora max nivel visible es 5)
- Al ganar nivel 5 (último): overlay de Victoria actual, sin vida extra

**Fuera de alcance (no en este spec):**
- Reemplaza `generateBlocksForLevel` y `mulberry32` de spec 03 (huecos aleatorios) — mulberry32 queda sin uso, se elimina
- Persistencia de nivel en localStorage (sigue arrancando en nivel 1)
- Selector de nivel / menú
- Cambios de tamaño de paddle o vidas base iniciales
- Formas adicionales o configurables por el usuario
- Bloques indestructibles o de más de 1 golpe

## Modelo de datos

Reemplaza en `levels.js`: elimina `mulberry32` y `generateBlocksForLevel` de spec 03. Nueva función central:

```js
const MAX_LEVEL = 5; // antes 10

const LEVEL_SHAPES = [
  'checkerboard',  // nivel 1
  'marco',         // nivel 2
  'escalera',      // nivel 3
  'diamante',      // nivel 4
  'piramide-invertida', // nivel 5
];

function isCoveredByShape( shape, row, col ) {
  // row: 0-5, col: 0-9 (BLOCK_ROWS x BLOCK_COLS)
  switch ( shape ) {
    case 'checkerboard':
      return ( row + col ) % 2 === 0;
    case 'marco':
      return row === 0 || row === BLOCK_ROWS - 1 || col === 0 || col === BLOCK_COLS - 1;
    case 'escalera':
      return col >= row * 3; // triángulo alineado a la izquierda, angosto abajo-derecha
    case 'diamante':
      return Math.abs( row - 2.5 ) + Math.abs( col - 4.5 ) <= 3; // rombo centrado
    case 'piramide-invertida': {
      const halfWidth = Math.max( 1, 5 - row ); // ancha arriba (row0), angosta abajo (row5)
      return Math.abs( col - 4.5 ) <= halfWidth;
    }
  }
}

function generateBlocksForLevel( level ) {
  const shape = LEVEL_SHAPES[ level - 1 ];
  const blocks = [];
  for ( let row = 0; row < BLOCK_ROWS; row++ ) {
    for ( let col = 0; col < BLOCK_COLS; col++ ) {
      if ( !isCoveredByShape( shape, row, col ) ) continue;
      blocks.push( { x: ..., y: ..., w: BLOCK_W, h: BLOCK_H, color: ROW_COLORS[ row ], alive: true } );
    }
  }
  return blocks;
}

function ballSpeedForLevel( level ) {
  return BALL_SPEED * ( 1 + 0.18 * ( level - 1 ) ); // tope nivel5 = 1.72x, antes repartido en 10
}
```

Coeficientes exactos de cada forma (umbral diamante, ancho pirámide) se afinan en implementación para verse bien visualmente — no bloquean el diseño.

`gameState.level` sigue 1-5 en vez de 1-10. Resto de `gameState` sin cambios respecto a spec 03.

## Plan de implementación

1. **Reemplazar `mulberry32`/`generateBlocksForLevel` en `levels.js`.** Eliminar PRNG y lógica de huecos aleatorios. Agregar `LEVEL_SHAPES`, `isCoveredByShape(shape, row, col)` y nueva `generateBlocksForLevel(level)` basada en formas (checkerboard, marco, escalera, diamante, pirámide invertida). Verificable de forma aislada (nivel 1 siempre da mismo patrón checkerboard, etc.).
2. **Actualizar `ballSpeedForLevel`.** Cambiar coeficiente de `0.08` a `0.18` para llegar a tope 1.72x en nivel 5 en vez de nivel 10.
3. **Actualizar tope de niveles en `main.js`.** Cambiar toda referencia a `10` (condición de último nivel, límite de avance) por `5` / `MAX_LEVEL`. Ajustar bonus de vida: se sigue sumando +1 en niveles 1-4 (no en 5), sin cambio de lógica, solo el límite superior cambia.
4. **HUD y overlay.** Sin cambios de código (ya muestran "Nivel: N" dinámico), solo verificar que el máximo visible ahora es 5.
5. **Verificación visual manual.** Jugar los 5 niveles: confirmar forma reconocible y distinta en cada uno, cobertura decreciente 1→5 a simple vista, velocidad de bola sube perceptiblemente, vida +1 en niveles 1-4, victoria en nivel 5 sin vida extra, sin errores de consola por bloques mal generados.

## Criterios de aceptación

- [ ] Nivel 1 muestra patrón checkerboard (celdas alternadas), ~50% de la grilla cubierta
- [ ] Nivel 2 muestra patrón de marco/borde hueco (perímetro cubierto, interior vacío)
- [ ] Nivel 3 muestra patrón de escalera (triángulo, angosto hacia una esquina)
- [ ] Nivel 4 muestra patrón de diamante (rombo centrado)
- [ ] Nivel 5 muestra patrón de pirámide invertida (ancha arriba, angosta abajo)
- [ ] Cobertura de bloques decrece visiblemente de nivel 1 a nivel 5 (más huecos a medida que sube el nivel)
- [ ] Mismo nivel genera siempre el mismo patrón al recargar/rejugar (determinístico, sin PRNG)
- [ ] Al romper todos los bloques de un nivel < 5, avanza automáticamente al siguiente sin overlay de Victoria
- [ ] Velocidad de bola aumenta cada nivel según `BALL_SPEED * (1 + 0.18*(nivel-1))`, tope nivel 5 ≈ 1.72x
- [ ] `gameState.lives` sube +1 al pasar de nivel en niveles 1-4 (tope +4 vidas totales en la partida)
- [ ] Al completar nivel 5, NO se suma vida extra, se muestra overlay de Victoria existente con puntaje final
- [ ] Puntaje NO se resetea al pasar de nivel
- [ ] HUD muestra "Nivel: N" con máximo N=5
- [ ] Al recargar la página (F5), el juego arranca en nivel 1
- [ ] High score en localStorage sigue funcionando igual que antes
- [ ] `mulberry32` y la lógica de huecos aleatorios de spec 03 ya no existen en el código

## Decisiones tomadas y descartadas

- **5 formas geométricas fijas, una por nivel, sin PRNG.** Descartado mantener huecos aleatorios de spec 03 — reemplazados por completo, `mulberry32` se elimina.
- **Formas determinísticas por fórmula (checkerboard, marco, escalera, diamante, pirámide invertida), no configurables.** Descartado sistema de patrones editables por usuario — fuera de alcance.
- **Orden de dificultad = cobertura de bloques decreciente (nivel1 ~50% → nivel5 ~15%).** Se asume menos bloques cubiertos = más difícil (huecos grandes dificultan despejar el nivel). Confirmado por el usuario.
- **Recalibrar velocidad a `0.18` por nivel (antes `0.08`).** Mantiene mismo tope final (~1.72x) pero repartido en 5 pasos en vez de 10.
- **Tope de vidas extra baja a +4 (antes +9).** Consecuencia directa de reducir niveles de 10 a 5, misma regla (+1 por nivel completado, excepto el último).
- **Spec nueva independiente que depende de 03**, no la reemplaza como archivo — 03 documenta el sistema de huecos aleatorios que existió; esta spec superpone/reemplaza esa lógica en código, pero ambos specs quedan como historial.
- **Coeficientes exactos de umbral (diamante) y ancho (pirámide) se afinan en implementación**, no se fijan de antemano — se ajustan visualmente durante el paso 1 del plan.

## Riesgos identificados

- **Fórmulas de diamante/pirámide invertida podrían generar muy pocos o demasiados bloques** en la implementación real (los umbrales son aproximados). Mitigación: ajuste visual en el paso 1 del plan, sin bloquear el resto de pasos.
- **Nivel 5 con velocidad 1.72x y pocos bloques (pirámide invertida angosta) puede ser muy difícil de completar.** Mitigación: ninguna funcional en este spec — si resulta injugable, ajustar en spec de balanceo posterior (igual riesgo que ya existía en spec 03 nivel 10).
- **Reducir de 10 a 5 niveles acorta la duración total de la partida.** Mitigación: ninguna — decisión explícita del usuario, no es un defecto.
