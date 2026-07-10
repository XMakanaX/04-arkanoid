const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const BLOCK_W = 78;
const BLOCK_H = 16;
const BLOCK_GAP = 2;
const BLOCK_ROWS = 6;
const BLOCK_COLS = 10;
const BLOCK_MARGIN_X = 1;
const BLOCK_MARGIN_TOP = 50;
const ROW_COLORS = [ 'red', 'yellow', 'green', 'cyan', 'magenta', 'hotpink' ];

const gameState = {
  status: 'ready',
  level: 1,
  score: 0,
  lives: 3,
  paddle: { x: ( canvas.width - 162 ) / 2, y: canvas.height - 40, w: 162, h: 14 },
  ball: { x: 0, y: 0, dx: 0, dy: 0, radius: 8, stuckToPaddle: true },
  blocks: [],
};

function mulberry32( seed ) {
  let a = seed;
  return function () {
    a |= 0;
    a = ( a + 0x6D2B79F5 ) | 0;
    let t = Math.imul( a ^ ( a >>> 15 ), 1 | a );
    t = ( t + Math.imul( t ^ ( t >>> 7 ), 61 | t ) ) ^ t;
    return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296;
  };
}

function generateBlocksForLevel( level ) {
  const random = mulberry32( level );
  const gapChance = level === 1 ? 0 : level * 0.03;
  const blocks = [];
  for ( let row = 0; row < BLOCK_ROWS; row++ ) {
    for ( let col = 0; col < BLOCK_COLS; col++ ) {
      if ( random() < gapChance ) continue;
      blocks.push( {
        x: BLOCK_MARGIN_X + col * ( BLOCK_W + BLOCK_GAP ),
        y: BLOCK_MARGIN_TOP + row * ( BLOCK_H + BLOCK_GAP ),
        w: BLOCK_W,
        h: BLOCK_H,
        color: ROW_COLORS[ row ],
        alive: true,
      } );
    }
  }
  return blocks;
}

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

const BALL_SPEED = 5;

function ballSpeedForLevel( level ) {
  return BALL_SPEED * ( 1 + 0.08 * ( level - 1 ) );
}

function snapBallToPaddle() {
  gameState.ball.x = gameState.paddle.x + gameState.paddle.w / 2;
  gameState.ball.y = gameState.paddle.y - gameState.ball.radius;
}

snapBallToPaddle();

function launchBall() {
  if ( gameState.status === 'gameover' || gameState.status === 'win' ) return;
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

  if ( gameState.level < 10 ) {
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

window.addEventListener( 'keydown', ( e ) => {
  if ( e.key === 'Enter' && ( gameState.status === 'win' || gameState.status === 'gameover' ) ) resetGame();
} );

function loop() {
  updatePaddle();
  updateBall();
  updateExplosions();
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
  ctx.font = '16px sans-serif';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText( 'Puntaje: ' + gameState.score, 10, 10 );
  ctx.fillText( 'Nivel: ' + gameState.level, 10, 30 );

  const lifeSize = 16;
  const lifeGap = 6;
  for ( let i = 0; i < gameState.lives; i++ ) {
    const x = canvas.width - 10 - ( i + 1 ) * lifeSize - i * lifeGap;
    drawSprite( ctx, 'ball', x, 10, lifeSize, lifeSize );
  }
}

loadSpritesheet( loop );
