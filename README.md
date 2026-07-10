# Juego de Arkanoid

Arkanoid en HTML/CSS/JavaScript puro, sin librerías ni frameworks. Corre directo en el navegador, sin build ni servidor (abrir `index.html`).

## Estado

MVP implementado y funcional. Progresión de niveles con formas geométricas, animación de explosión al romper bloques, pausa y highscore persistente.

## Archivos

- `index.html` — markup y canvas del juego
- `main.js` — loop principal, input, física de la pelota, colisiones, estados (jugando/pausa/win/gameover)
- `levels.js` — definición de niveles (formas geométricas de bloques)
- `style.css` — estilos
- `assets/spritesheet-breakout.png` + `assets/spritesheet.js` — sprites de paddle/pelota/bloques y frames de explosión
- `assets/sounds/*.mp3` — sonidos de rebote y rotura de bloque

## Controles

- `←`/`→` o `A`/`D` — mover paddle
- `Espacio` — lanzar pelota
- `P` — pausar/reanudar
- `Enter` — reiniciar (en pantalla de victoria o game over)

## Mecánicas

- Niveles con bloques dispuestos en formas geométricas fijas, velocidad de la pelota escala por nivel.
- Highscore persistido en `localStorage` (`arkanoid-highscore`).
- Overlay de pausa con botón de reanudar.

## Desarrollo (spec-driven)

Nuevas features se diseñan primero con `/spec` y se implementan con `/spec-impl` sobre specs aprobadas. Ver `CLAUDE.md` para el detalle del flujo y `specs/` para el historial de specs (`01-arkanoid-mvp`, `02-explosion-animation-mejora`, `03-progresion-niveles`, `04-formas-geometricas-5-niveles`, todas en estado `Implementado`).
