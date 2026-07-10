const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const gameState = {
  status: 'ready',
  level: 1,
  score: 0,
  lives: 3,
  paddle: { x: ( canvas.width - 81 ) / 2, y: canvas.height - 40, w: 81, h: 7 },
  ball: { x: 0, y: 0, dx: 0, dy: 0, radius: 8, stuckToPaddle: true },
  blocks: [],
  paused: false,
};

gameState.blocks = generateBlocksForLevel( 1 );

const PADDLE_SPEED = 8;
const keys = { left: false, right: false };

window.addEventListener( 'keydown', ( e ) => {
  if ( e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ) keys.left = true;
  if ( e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ) keys.right = true;
} );

window.addEventListener( 'keyup', ( e ) => {
  if ( e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ) keys.left = false;
  if ( e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ) keys.right = false;
} );

canvas.addEventListener( 'mousemove', ( e ) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  gameState.paddle.x = clampPaddleX( mouseX - gameState.paddle.w / 2 );
} );

function clampPaddleX( x ) {
  return Math.max( 0, Math.min( canvas.width - gameState.paddle.w, x ) );
}

function updatePaddle() {
  if ( keys.left ) gameState.paddle.x -= PADDLE_SPEED;
  if ( keys.right ) gameState.paddle.x += PADDLE_SPEED;
  gameState.paddle.x = clampPaddleX( gameState.paddle.x );
}

function snapBallToPaddle() {
  gameState.ball.x = gameState.paddle.x + gameState.paddle.w / 2;
  gameState.ball.y = gameState.paddle.y - gameState.ball.radius;
}

snapBallToPaddle();

function launchBall() {
  if ( gameState.status === 'gameover' || gameState.status === 'win' ) return;
  if ( gameState.paused ) return;
  if ( !gameState.ball.stuckToPaddle ) return;
  const speed = ballSpeedForLevel( gameState.level );
  gameState.ball.stuckToPaddle = false;
  gameState.ball.dx = speed * 0.6;
  gameState.ball.dy = -speed;
  gameState.status = 'playing';
}

window.addEventListener( 'keydown', ( e ) => {
  if ( e.key === ' ' ) launchBall();
} );

canvas.addEventListener( 'click', launchBall );

const bounceSound = new Audio( 'assets/sounds/ball-bounce.mp3' );

function playBounce() {
  bounceSound.currentTime = 0;
  bounceSound.play();
}

function updateBall() {
  const ball = gameState.ball;

  if ( gameState.status === 'gameover' || gameState.status === 'win' ) return;

  if ( ball.stuckToPaddle ) {
    snapBallToPaddle();
    return;
  }

  ball.x += ball.dx;
  ball.y += ball.dy;

  if ( ball.x - ball.radius < 0 ) {
    ball.x = ball.radius;
    ball.dx *= -1;
    playBounce();
  } else if ( ball.x + ball.radius > canvas.width ) {
    ball.x = canvas.width - ball.radius;
    ball.dx *= -1;
    playBounce();
  }

  if ( ball.y - ball.radius < 0 ) {
    ball.y = ball.radius;
    ball.dy *= -1;
    playBounce();
  }

  const paddle = gameState.paddle;
  const hitsPaddle = ball.dy > 0 &&
    ball.x + ball.radius > paddle.x &&
    ball.x - ball.radius < paddle.x + paddle.w &&
    ball.y + ball.radius > paddle.y &&
    ball.y - ball.radius < paddle.y + paddle.h;

  if ( hitsPaddle ) {
    ball.y = paddle.y - ball.radius;
    ball.dy *= -1;
    playBounce();
  }

  handleBlockCollision();
  handleBallLoss();
}

function handleBallLoss() {
  const ball = gameState.ball;
  if ( ball.y - ball.radius <= canvas.height ) return;

  gameState.lives -= 1;

  if ( gameState.lives <= 0 ) {
    gameState.status = 'gameover';
    return;
  }

  ball.stuckToPaddle = true;
  ball.dx = 0;
  ball.dy = 0;
  snapBallToPaddle();
}

const breakSound = new Audio( 'assets/sounds/break-sound.mp3' );
const explosions = [];
const EXPLOSION_FRAME_DURATION = EXPLOSION_DURATION / 4;

function handleBlockCollision() {
  const ball = gameState.ball;
  let closestBlock = null;
  let closestDist = Infinity;
  let closestX = 0;
  let closestY = 0;

  for ( const block of gameState.blocks ) {
    if ( !block.alive ) continue;

    const cx = Math.max( block.x, Math.min( ball.x, block.x + block.w ) );
    const cy = Math.max( block.y, Math.min( ball.y, block.y + block.h ) );
    const dx = ball.x - cx;
    const dy = ball.y - cy;
    const dist = dx * dx + dy * dy;

    if ( dist <= ball.radius * ball.radius && dist < closestDist ) {
      closestDist = dist;
      closestBlock = block;
      closestX = cx;
      closestY = cy;
    }
  }

  if ( !closestBlock ) return;

  closestBlock.alive = false;
  gameState.score += 10;
  updateHighScore();

  const hitX = closestX !== ball.x;
  const hitY = closestY !== ball.y;
  if ( hitX ) ball.dx *= -1;
  if ( hitY ) ball.dy *= -1;
  if ( !hitX && !hitY ) ball.dy *= -1;

  explosions.push( {
    x: closestBlock.x,
    y: closestBlock.y,
    color: closestBlock.color,
    start: Date.now(),
  } );

  breakSound.currentTime = 0;
  breakSound.play();
  playBounce();

  checkWin();
}

function checkWin() {
  const allDead = gameState.blocks.every( ( block ) => !block.alive );
  if ( !allDead ) return;

  if ( gameState.level < MAX_LEVEL ) {
    gameState.level += 1;
    gameState.lives += 1;
    gameState.blocks = generateBlocksForLevel( gameState.level );
    gameState.ball.stuckToPaddle = true;
    gameState.ball.dx = 0;
    gameState.ball.dy = 0;
    snapBallToPaddle();
    gameState.status = 'levelup';
  } else {
    gameState.status = 'win';
  }
}

function updateExplosions() {
  const now = Date.now();
  for ( let i = explosions.length - 1; i >= 0; i-- ) {
    if ( now - explosions[ i ].start >= EXPLOSION_DURATION ) {
      explosions.splice( i, 1 );
    }
  }
}

const HIGHSCORE_KEY = 'arkanoid-highscore';
let highScore = parseInt( localStorage.getItem( HIGHSCORE_KEY ), 10 ) || 0;

function updateHighScore() {
  if ( gameState.score > highScore ) {
    highScore = gameState.score;
    localStorage.setItem( HIGHSCORE_KEY, String( highScore ) );
  }
}

const levelupOverlay = document.getElementById( 'levelup-overlay' );
const levelupTitle = document.getElementById( 'levelup-title' );
let levelupTimeout = null;

function updateLevelupOverlay() {
  if ( gameState.status !== 'levelup' ) return;
  if ( levelupTimeout ) return;

  levelupTitle.textContent = '¡Nivel ' + gameState.level + '!';
  levelupOverlay.classList.remove( 'hidden' );

  levelupTimeout = setTimeout( () => {
    levelupOverlay.classList.add( 'hidden' );
    gameState.status = 'ready';
    levelupTimeout = null;
  }, 1500 );
}

const overlay = document.getElementById( 'overlay' );
const overlayTitle = document.getElementById( 'overlay-title' );
const overlayScore = document.getElementById( 'overlay-score' );
const overlayHighscore = document.getElementById( 'overlay-highscore' );
const overlayRestart = document.getElementById( 'overlay-restart' );

function updateOverlay() {
  if ( gameState.status !== 'win' && gameState.status !== 'gameover' ) {
    overlay.classList.add( 'hidden' );
    return;
  }

  overlay.classList.remove( 'hidden' );
  overlayTitle.textContent = gameState.status === 'win' ? '¡Victoria!' : 'Game Over';
  overlayScore.textContent = 'Puntaje: ' + gameState.score;
  overlayHighscore.textContent = 'High score: ' + highScore;
}

function resetGame() {
  gameState.status = 'ready';
  gameState.level = 1;
  gameState.score = 0;
  gameState.lives = 3;
  gameState.blocks = generateBlocksForLevel( 1 );
  gameState.paddle.x = ( canvas.width - gameState.paddle.w ) / 2;
  gameState.ball.stuckToPaddle = true;
  gameState.ball.dx = 0;
  gameState.ball.dy = 0;
  snapBallToPaddle();
  explosions.length = 0;
}

overlayRestart.addEventListener( 'click', resetGame );

const pauseOverlay = document.getElementById( 'pause-overlay' );
const pauseResumeBtn = document.getElementById( 'pause-resume' );

function togglePause() {
  if ( gameState.status === 'gameover' || gameState.status === 'win' ) return;
  gameState.paused = !gameState.paused;
  pauseOverlay.classList.toggle( 'hidden', !gameState.paused );
}

pauseResumeBtn.addEventListener( 'click', togglePause );

window.addEventListener( 'keydown', ( e ) => {
  if ( e.key === 'p' || e.key === 'P' ) togglePause();
} );

window.addEventListener( 'keydown', ( e ) => {
  if ( e.key === 'Enter' && ( gameState.status === 'win' || gameState.status === 'gameover' ) ) resetGame();
} );

function loop() {
  if ( !gameState.paused ) {
    updatePaddle();
    updateBall();
    updateExplosions();
    updateLevelupOverlay();
  }
  updateOverlay();
  draw();
  requestAnimationFrame( loop );
}

function draw() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );

  for ( const block of gameState.blocks ) {
    if ( !block.alive ) continue;
    drawSprite( ctx, 'block_' + block.color, block.x, block.y, block.w, block.h );
  }

  drawSprite( ctx, 'paddle', gameState.paddle.x, gameState.paddle.y, gameState.paddle.w, gameState.paddle.h );

  const ball = gameState.ball;
  drawSprite( ctx, 'ball', ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2 );

  const now = Date.now();
  for ( const explosion of explosions ) {
    const progress = ( now - explosion.start ) / EXPLOSION_DURATION;
    const frameIndex = Math.min( 3, Math.floor( ( now - explosion.start ) / EXPLOSION_FRAME_DURATION ) );
    const frame = EXPLOSION_FRAMES[ explosion.color ][ frameIndex ];
    const scale = 1.0 + progress * 0.8;
    const alpha = progress < 0.5 ? 1 : 1 - ( progress - 0.5 ) * 2;
    ctx.save();
    ctx.translate( explosion.x + BLOCK_W / 2, explosion.y + BLOCK_H / 2 );
    ctx.scale( scale, scale );
    ctx.globalAlpha = alpha;
    drawFrame( ctx, frame, -BLOCK_W / 2, -BLOCK_H / 2, BLOCK_W, BLOCK_H );
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.textBaseline = 'top';

  ctx.textAlign = 'left';
  ctx.fillText( 'PUNTAJE: ' + gameState.score, 10, 12 );

  ctx.textAlign = 'center';
  ctx.fillText( 'NIVEL: ' + gameState.level, canvas.width / 2, 12 );

  const lifeSize = 16;
  const lifeGap = 6;
  for ( let i = 0; i < gameState.lives; i++ ) {
    const x = canvas.width - 10 - ( i + 1 ) * lifeSize - i * lifeGap;
    drawSprite( ctx, 'ball', x, 10, lifeSize, lifeSize );
  }

}

loadSpritesheet( loop );
