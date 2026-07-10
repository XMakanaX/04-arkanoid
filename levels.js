const BLOCK_W = 86;
const BLOCK_H = 20;
const BLOCK_GAP = 2;
const BLOCK_ROWS = 6;
const BLOCK_COLS = 9;
const BLOCK_MARGIN_X = 5;
const BLOCK_MARGIN_TOP = 50;
const ROW_COLORS = [ 'red', 'yellow', 'green', 'cyan', 'magenta', 'hotpink' ];

const BALL_SPEED = 5;

const MAX_LEVEL = 5;

const LEVEL_SHAPES = [
  'checkerboard',
  'marco',
  'escalera',
  'diamante',
  'piramide-invertida',
];

function isCoveredByShape( shape, row, col ) {
  switch ( shape ) {
    case 'checkerboard':
      return ( row + col ) % 2 === 0;
    case 'marco':
      return row === 0 || row === BLOCK_ROWS - 1 || col === 0 || col === BLOCK_COLS - 1;
    case 'escalera':
      return col >= row * 3;
    case 'diamante':
      return Math.abs( row - 2.5 ) + Math.abs( col - ( BLOCK_COLS - 1 ) / 2 ) <= 3;
    case 'piramide-invertida': {
      const halfWidth = Math.max( 1, 5 - row );
      return Math.abs( col - ( BLOCK_COLS - 1 ) / 2 ) <= halfWidth;
    }
  }
}

function generateBlocksForLevel( level ) {
  const shape = LEVEL_SHAPES[ level - 1 ];
  const blocks = [];
  for ( let row = 0; row < BLOCK_ROWS; row++ ) {
    for ( let col = 0; col < BLOCK_COLS; col++ ) {
      if ( !isCoveredByShape( shape, row, col ) ) continue;
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
  return BALL_SPEED * ( 1 + 0.18 * ( level - 1 ) );
}
