const BLOCK_W = 78;
const BLOCK_H = 16;
const BLOCK_GAP = 2;
const BLOCK_ROWS = 6;
const BLOCK_COLS = 10;
const BLOCK_MARGIN_X = 1;
const BLOCK_MARGIN_TOP = 50;
const ROW_COLORS = [ 'red', 'yellow', 'green', 'cyan', 'magenta', 'hotpink' ];

const BALL_SPEED = 5;

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

function ballSpeedForLevel( level ) {
  return BALL_SPEED * ( 1 + 0.08 * ( level - 1 ) );
}
