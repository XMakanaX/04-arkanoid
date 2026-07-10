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
  score: 0,
  lives: 3,
  paddle: { x: ( canvas.width - 162 ) / 2, y: canvas.height - 40, w: 162, h: 14 },
  ball: { x: 0, y: 0, dx: 0, dy: 0, radius: 8, stuckToPaddle: true },
  blocks: [],
};

function buildBlocks() {
  const blocks = [];
  for ( let row = 0; row < BLOCK_ROWS; row++ ) {
    for ( let col = 0; col < BLOCK_COLS; col++ ) {
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

gameState.blocks = buildBlocks();

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

function snapBallToPaddle() {
  gameState.ball.x = gameState.paddle.x + gameState.paddle.w / 2;
  gameState.ball.y = gameState.paddle.y - gameState.ball.radius;
}

snapBallToPaddle();

function launchBall() {
  if ( gameState.status === 'gameover' || gameState.status === 'win' ) return;
  if ( !gameState.ball.stuckToPaddle ) return;
  gameState.ball.stuckToPaddle = false;
  gameState.ball.dx = BALL_SPEED * 0.6;
  gameState.ball.dy = -BALL_SPEED;
  gameState.status = 'playing';
}

window.addEventListener( 'keydown', ( e ) => {
  if ( e.key === ' ' ) launchBall();
} );

canvas.addEventListener( 'click', launchBall );

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
  } else if ( ball.x + ball.radius > canvas.width ) {
    ball.x = canvas.width - ball.radius;
    ball.dx *= -1;
  }

  if ( ball.y - ball.radius < 0 ) {
    ball.y = ball.radius;
    ball.dy *= -1;
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
}

function updateExplosions() {
  const now = Date.now();
  for ( let i = explosions.length - 1; i >= 0; i-- ) {
    if ( now - explosions[ i ].start >= EXPLOSION_DURATION ) {
      explosions.splice( i, 1 );
    }
  }
}

function loop() {
  updatePaddle();
  updateBall();
  updateExplosions();
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
    const frameIndex = Math.min( 3, Math.floor( ( now - explosion.start ) / EXPLOSION_FRAME_DURATION ) );
    const frame = EXPLOSION_FRAMES[ explosion.color ][ frameIndex ];
    drawFrame( ctx, frame, explosion.x, explosion.y, BLOCK_W, BLOCK_H );
  }
}

loadSpritesheet( loop );
