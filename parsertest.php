<html>

<head>

<title>A test file for the javascript sgf parsing object</title>

<script type="text/javascript" src="/jquery.js"></script>
<script type="text/javascript" src="/jquery.gogame.js"></script>
<script type="text/javascript" src="/jquery.sgfparser.js"></script>

<script type="text/javascript">

$( document ).ready( function()
{
	// The url of the sgf file data
	var url = '/tolley.sgf';
	
	// A global variable to store the go game data
	window.goGame = false;

	// Get the game data from the server and parse it into javascript structures
	$.loadSGF( url, function( gameTree )
	{
		window.goGame = gameTree;
		console.log( window.goGame );
		
/*		for( var n in window.goGame )
		{
			for( var m in window.goGame[n] )
			{
				console.log( m + ' = ' + window.goGame[n][m] );
			}// End for m
			console.log( 'End node' );
		}// End for n
*/
	} );
} );
</script>

</head>

<body>

<div id="goban">
</div>

</body>

</html>