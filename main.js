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

function draw() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );

  for ( const block of gameState.blocks ) {
    if ( !block.alive ) continue;
    drawSprite( ctx, 'block_' + block.color, block.x, block.y, block.w, block.h );
  }

  drawSprite( ctx, 'paddle', gameState.paddle.x, gameState.paddle.y, gameState.paddle.w, gameState.paddle.h );
}

loadSpritesheet( draw );
