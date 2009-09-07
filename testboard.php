<?
// Author : Chris Tolley
// Date   : 5/28/2009
// Desc   : A test script to develop the html to display a go board

// The size of the board
$boardSize = 17;
?>
<html>

<head>

<title>A 19 x 19 Go board in HTML</title>

<style type="text/css">

#goban td {
	height:20px;
	width:20px;
}

/* Center liberty */
#goban .c { 
	background: url('/images/c-20x20.png') no-repeat 0 0;
}

/* Center star point */
#goban .cs {
	background: url('/images/cs-20x20.png') no-repeat 0 0;
}

/* Top left corner */
#goban .tl {
	background: url('/images/tl-20x20.png') no-repeat 0 0;
}

/* Top right corner */
#goban .tr {
	background: url('/images/tr-20x20.png') no-repeat 0 0;
}

/* Bottom left corner */
#goban .bl {
	background: url('/images/bl-20x20.png') no-repeat 0 0;
}

/* Bottom right corner */
#goban .br {
	background: url('/images/br-20x20.png') no-repeat 0 0;
}

/* Top first line */
#goban .t {
	background: url('/images/t-20x20.png') no-repeat 0 0;
}

/* Bottom first line */
#goban .b {
	background: url('/images/b-20x20.png') no-repeat 0 0;
}

/* Left first line */
#goban .l {
	background: url('/images/l-20x20.png') no-repeat 0 0;
}

/* Right first line */
#goban .r {
	background: url('/images/r-20x20.png') no-repeat 0 0;
}

</style>

</head>

<body>

<table border="0" cellspacing="0" cellpadding="0" id="goban">
<?

// Foreach row on the board
for( $x = 0; $x < $boardSize; ++$x )
{
	echo '<tr>';
	// Foreach column on the board
	for( $y = 0; $y < $boardSize; ++$y )
	{
		echo '<td class="' . getClassName( $x, $y, $boardSize ) . '"></td>';
	}// End for y
	echo '</tr>';
}// End for x

?>
</table>

</body>

</html>
<?

// Takes in the x and y coordinates and returns the appropriate css class name
function getClassName( $x, $y, $boardSize )
{
	// If our board size is less than 17, only show 5 star points.
	$nineStars = true;
	if( $boardSize < 17 )
		$nineStars = false;

	// Deincrement the board size because computers start counting at zero
	$boardSize--;

	// The return value
	$className = 'c';
	
	// The series of if else if statements basically handle the edges of the board.
	// If the final else condition is executed it will check for star points.  The
	// default return value is a center open liberty
	if( $x == 0 )
	{
		if( $y == 0 )
			$className = 'tl';
		else if( $y == $boardSize )
			$className = 'tr';
		else
			$className = 't';
	}// End if
	else if( $x == $boardSize )
	{
		if( $y == 0 )
			$className = 'bl';
		else if( $y == $boardSize )
			$className = 'br';
		else
			$className = 'b';				
	}// End else if
	else if( $y == 0 )
	{
		$className = 'l';
	}// End else if
	else if( $y == $boardSize )
	{
		$className = 'r';
	}// End else if
	else
	{
		// Here we check for star points
		// Calculate the center of the board
		$center = ceil( ( $boardSize ) / 2 );
		
		if( $x == 3 )
		{
			if( $y == 3 )
				$className = 'cs';
			else if( $y == ( $boardSize - 3 ) )
				$className = 'cs';
			else if( $y == $center && $nineStars )
				$className = 'cs';
		}// End else if
		else if( $x == $center )
		{
			if( $y == 3 && $nineStars )
				$className = 'cs';
			else if( $y == ( $boardSize - 3 ) && $nineStars )
				$className = 'cs';
			else if( $y == $center )
				$className = 'cs';
		}// End else if
		else if( $x == ( $boardSize - 3 ) )
		{
			if( $y == 3 )
				$className = 'cs';
			else if( $y == ( $boardSize - 3 ) )
				$className = 'cs';
			else if( $y == $center && $nineStars )
				$className = 'cs';
		}// End else if
	}// End else
	
	return $className;
}// End function getClassName