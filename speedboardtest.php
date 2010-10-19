<?
/**
 * @file	speedboardtest.php
 * @desc	A test file for working with a speedier version of the goban
 */

?>

<html>

<head>

<script type="text/javascript" src="/jquery.js"></script>
<script type="text/javascript">

$( document ).ready( function()
{
	// Transform each goban div into a go board
	$( 'div.goban' ).each( function()
	{
		// The size of the board
		var boardSize = 19;

		// Calculate the max dimensions for the board plus coordinates
		var xMax = boardSize + 2;
		var yMax = boardSize + 2;
		
		// Set the style information on the element the board will display inside of
		this.style.height = String( xMax * 20 ) + 'px';
		this.style.width = String( yMax * 20 ) + 'px';

		// Build each tile that will make up the board display
		for( var x = 0; x < xMax; ++x )
		{
			for( var y = 0; y < yMax; ++y )
			{
				// Build the base tile
				var newTile = document.createElement( 'div' );
				
				// Get the position for this stone
				var position = calculateTileCoordinates( x, y, this );
				newTile.style.left = position.left;
				newTile.style.top = position.top;
				
				var className = 'tile ';
				
				// Add the className that will give the tile the proper display
				// If we have a tile that is part of the UI (the side coordinates)
				if( x == 0 || y == 0 || x == xMax - 1 || y == yMax - 1 )
				{
					className += 'blank';
					
					// Calculate the innerHTML for the coordinates display
					newTile.innerHTML = calculateSideCoordinate( x, y, boardSize );
				}// End if
				else
				{
					// Otherwise, we have a liberty tile and need to calculate the proper
					// image so that it displayes correctly
					className += calculateLibertyClass( x, y, boardSize );

					newTile.innerHTML = '&nbsp;';
				}// End else
					
				newTile.className = className;
				this.appendChild( newTile );
			}// End for y
		}// End for x
	} );
	
	// Returns the top and left coordinates for a given liberty
	function calculateTileCoordinates( x, y, boardElem )
	{
		var returnValue = { top: 0, left: 0 };
		
		// Get the offset of the DOM element that holds the board UI
		var gobanPosition = $( boardElem ).offset();
		
		returnValue.left = ( 20 * y ) + gobanPosition.left + 1;
		returnValue.top = ( 20 * x ) + gobanPosition.top + 1;
		
		return returnValue;
	}// End function calculateTileCoordinates

	
	// A function that will return the proper innerHTML for the side coordinates
	function calculateSideCoordinate( x, y, boardSize )
	{
		// The return value
		var innerHTML = '&nbsp;';
		
		// The maximum for x and y with the boardSize
		var xMax = boardSize + 1;
		var yMax = boardSize + 1;

		// In building the side coordinates, we have to make sure not to set an innerHTML for the corner tiles.
		// The corner tiles are left blank so that the coordinates will line up with the liberty the coorespond to

		// If we are on the top row, and it's not a tile
		if( x == 0 && ( y != 0 && y != yMax ) )
		{
			// Theres no i in the coordinates
			if( y >= 9 )
				y++;
			innerHTML = String.fromCharCode( y + 64 );
		}// End if
		
		// If we are on the bottom row, and it's not a tile
		else if( x == xMax && ( y != 0 && y != yMax ) )
		{
			// Theres no i in the coordinates
			if( y >= 9 )
				y++;
			innerHTML = String.fromCharCode( y + 64 );
		}// End if
		
		// If we are on the left side, and it's not a tile
		else if( y == 0 && ( x != 0 && x != xMax ) )
			innerHTML = x;
		
		// If we are on the right side, and it's not a tile
		else if( y == yMax && ( x != 0 && x != xMax ) )
			innerHTML = x;

		return innerHTML;
	}// End if
	
	// A function that will calculate the proper className to give to a liberty tile
	// based on the coordinates past in, and return it.
	function calculateLibertyClass( x, y, boardSize )
	{
		// The default liberty className
		var className = 'c';

		// If the tile is on the top row
		if( x == 1 )
		{
			// If we have the top left tile
			if( y == 1 )
				className = 'tl';
			// If we have the top right tile
			else if( y == boardSize )
				className = 'tr';
			else
				className = 't';
		}// End if
		// If the tile is on the bottom row
		else if( x == boardSize )
		{
			// If we have the bottom left tile
			if( y == 1 )
				className = 'bl';
			// If we have the bottom right tile
			else if( y == boardSize )
				className = 'br';
			else
				className = 'b';
		}// End if
		// If we have a left side tile
		else if( y == 1 )
			className = 'l';
		// If we have a right side tile
		else if( y == boardSize )
			className = 'r';
		else
		{
			// Otherwise, we have to check for a star point

			// Calculate the center of the board
			var center = Math.ceil( ( boardSize ) / 2 );
			
			// The value for corner star points
			var cornerStar = ( boardSize >= 13 )? 4: 3;
			
			// Top star points
			if( x == cornerStar )
			{
				if( y == cornerStar )
					className = 'cs';
				else if( y == ( boardSize - ( cornerStar - 1 ) ) )
					className = 'cs';
				else if( y == center && boardSize >= 17 )
					className = 'cs';
			}// End else if
			// Middle star points
			else if( x == center )
			{
				if( y == 4 && boardSize >= 17 )
 					className = 'cs';
				else if( y == ( boardSize - 3 ) && boardSize >= 17 )
					className = 'cs';
				else if( y == center )
					className = 'cs';
			}// End else if
			// Bottom star points
			else if( x == ( boardSize - ( cornerStar - 1 ) ) )
			{
				if( y == cornerStar )
					className = 'cs';
				else if( y == ( boardSize - ( cornerStar - 1 ) ) )
					className = 'cs';
				else if( y == center && boardSize >= 17 )
					className = 'cs';
			}// End else if
		}// End else
		
		// Add the info that the board engine will use to display the turns
		// Note: This code should stay at the very end of this function because we are incrementing x and y

		// There are no I's in go coordinates
		if( x >= 9 )
			x++;
		
		if( y >= 9 )
			y++;

		// Using these class names, we can select a liberty by using it's x,y coordinates: $( '.liberty-x-y' )
		className += ' liberty liberty-' + String.fromCharCode( x + 97 ) + '-' + String.fromCharCode( y + 97 );

		// Return the calculated className
		return className;
	}// End function calculateLibertyClass
} );

</script>

<style type="text/css">

div.goban {
	border: solid 1px #000;
}

div.goban .tile {
	position: absolute;
	height: 20px;
	width: 20px;
	border: 0px;
	margin: 0px;
	padding: 0px;
	text-align: center;
}

/* The liberty and stone images */
.goban .b {
	background: url(/images/b-20x20.png) no-repeat;	
}
.goban .bl {
	background: url(/images/bl-20x20.png) no-repeat;
}
.goban .black {
	background: url(/images/black-20x20.png) no-repeat;
}
.goban .br {
	background: url(/images/br-20x20.png) no-repeat;
}
.goban .c {
	background: url(/images/c-20x20.png) no-repeat;
}
.goban .cs {
	background: url(/images/cs-20x20.png) no-repeat;
}
.goban .l {
	background: url(/images/l-20x20.png) no-repeat;
}
.goban .r {
	background: url(/images/r-20x20.png) no-repeat;
}
.goban .t {
	background: url(/images/t-20x20.png) no-repeat;
}
.goban .tl {
	background: url(/images/tl-20x20.png) no-repeat;
}
.goban .tr {
	background: url(/images/tr-20x20.png) no-repeat;
}
.goban .white {
	background: url(/images/white-20x20.png) no-repeat;
}

/* The image that goes around the actual board */
.goban .blank {
	background: url(/images/blank-20x20.png) no-repeat;
	color: #000;
	font-size: 12px;
	font-family: helvetica;
}

</style>

</head>

<body>

<div class="goban">
</div>

</body>

</html>