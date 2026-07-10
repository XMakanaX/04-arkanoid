# Arkanoid MVP jugable

**Estado:** aprobado
**Depende de:** —
**Fecha:** 2026-07-09
**Objetivo:** Construir un MVP jugable de Arkanoid de un solo nivel, con paddle controlado por mouse/teclado, sistema de vidas, puntaje y high score persistente, usando los assets existentes (spritesheet y sonidos).

## Alcance

**Incluido:**
- Canvas único de 800x600px, un solo nivel de juego
- Grid de bloques: 6 filas x 10 columnas, bloque 78px ancho x 16px alto, gap 2px horizontal y vertical, color distinto por fila (de los 7 colores del spritesheet)
- Paddle controlable simultáneamente por mouse (seguir posición X) y teclado (flechas/A-D)
- Bola: arranca pegada al paddle, se lanza con click o espacio; rebota en paredes, paddle y bloques
- Sistema de vidas: 3 vidas, se pierde una al caer la bola por debajo del paddle
- Puntaje: 10 puntos por bloque roto, visible en pantalla durante el juego
- High score persistente en localStorage (se actualiza si el puntaje de la partida lo supera)
- Overlay de Victoria (todos los bloques rotos) y overlay de Game Over (0 vidas), ambos simples
- Animación de explosión al romper bloque (usa `EXPLOSION_FRAMES` ya definido por color) y sonidos existentes (`ball-bounce`, `break-sound`)
- Reinicio de partida desde el overlay (botón o tecla)

**Fuera de alcance (no en este spec):**
- Múltiples niveles o progresión
- Power-ups
- Bloques indestructibles o de más de 1 golpe
- Menú principal, pantalla de opciones, pausa
- Responsive/mobile, soporte táctil
- Multijugador
- Efectos visuales avanzados (partículas extra, shaders)

## Modelo de datos

Estructuras principales en memoria (JS plano, sin frameworks):

```js
const gameState = {
  status: 'ready' | 'playing' | 'win' | 'gameover', // estado general
  score: 0,
  lives: 3,
  paddle: { x, y, w: 162, h: 14 },
  ball: { x, y, dx, dy, radius: 8, stuckToPaddle: true },
  blocks: [ { x, y, w: 78, h: 16, color: 'red', alive: true }, ... ], // 60 bloques (6x10)
};
```

**Persistencia (localStorage):**
- Clave: `arkanoid-highscore`
- Valor: número entero (highscore actual)
- Sin versionado (estructura trivial, MVP)

## Plan de implementación

1. **Estructura base:** crear `index.html` (canvas 800x600, carga scripts), `style.css` (centrado, fondo), enlazar `assets/spritesheet.js` y sonidos. Canvas visible, vacío.
2. **Cargar y dibujar assets:** usar `loadSpritesheet` para renderizar paddle y grid de 60 bloques (6x10, color por fila, gap 2px). Sin movimiento aún.
3. **Paddle controlable:** mover paddle con mouse (seguir X) y teclado (flechas/A-D) simultáneamente, con límites del canvas.
4. **Bola y física básica:** bola pegada al paddle, se lanza con click/espacio, rebota en paredes y paddle. Sin colisión con bloques todavía.
5. **Colisión bola-bloques:** detectar colisión, marcar bloque `alive: false`, sumar 10 puntos, mostrar animación de explosión (`EXPLOSION_FRAMES`), reproducir `break-sound`.
6. **Vidas y reinicio de bola:** si la bola cae debajo del paddle, restar vida y reposicionar bola pegada al paddle (o game over si vidas llegan a 0).
7. **Condición de victoria:** detectar todos los bloques `alive: false`, mostrar overlay de Victoria.
8. **Overlays de Game Over y Victoria:** overlay simple con mensaje, puntaje final, y botón/tecla de reinicio.
9. **Puntaje visible y high score:** mostrar score en pantalla durante juego; leer/escribir `arkanoid-highscore` en localStorage, mostrar en overlays.
10. **Sonido de rebote:** reproducir `ball-bounce` en cada colisión de la bola con paredes/paddle/bloques.

## Criterios de aceptación

- [x] Canvas de 800x600px se renderiza correctamente en el navegador
- [x] Grid de 60 bloques (6x10) se muestra con color distinto por fila
- [x] Paddle se mueve con mouse y con teclado (flechas/A-D), sin salirse del canvas
- [x] Bola arranca pegada al paddle y se lanza con click o espacio
- [x] Bola rebota correctamente en paredes, paddle y bloques
- [x] Al golpear un bloque: bloque desaparece, se reproduce animación de explosión, suena `break-sound`, suma 10 puntos
- [x] Score visible en pantalla se actualiza en tiempo real
- [x] Al caer la bola bajo el paddle: se resta 1 vida y la bola se reposiciona pegada al paddle (si quedan vidas)
- [x] Al llegar a 0 vidas: se muestra overlay de Game Over con puntaje final
- [x] Al romper todos los bloques: se muestra overlay de Victoria con puntaje final
- [x] High score se guarda en localStorage y persiste entre recargas de página
- [x] Overlay muestra el high score guardado
- [x] Desde el overlay se puede reiniciar la partida (botón o tecla)
- [x] Sonido `ball-bounce` suena en cada rebote de la bola

## Decisiones tomadas y descartadas

- **Un solo nivel, sin bloques indestructibles.** Descartado nivel múltiple/progresión para mantener MVP acotado. Todos los bloques se rompen en 1 golpe.
- **Grid 6x10, bloque 78px + 2px gap.** Se ajusta a canvas 800px de ancho sin decimales (10 x 78 + 9 x 2 = 798, +1px margen c/lado). Descartado bloques pegados (80px) por preferencia visual.
- **Mouse + teclado simultáneo para paddle.** Descartado un solo método de control; ambos inputs actualizan la misma posición X del paddle.
- **LocalStorage solo para high score.** Descartado guardar historial de partidas o progreso — estructura mínima, sin versionado, dato trivial.
- **Overlay simple para Victoria/Game Over.** Descartada pantalla de menú o transiciones animadas — solo texto + puntaje + botón de reinicio.
- **Sin power-ups ni niveles múltiples.** Quedan fuera del alcance de este spec, candidatos a specs futuros.

## Riesgos identificados

- **Autoplay de sonido bloqueado por navegador.** Chrome/Firefox bloquean audio antes de interacción del usuario. Mitigación: reproducir sonidos solo después del primer click/tecla (lanzamiento de bola ya requiere interacción, cubre el caso).
- **Colisión bola-bloques con múltiples bloques adyacentes en el mismo frame.** Mitigación: resolver una sola colisión por frame (la más cercana) para evitar bugs de doble rebote.
