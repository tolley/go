// Author : Chris Tolley
// Date   : 9/1/2009
// Desc   : A javascript file that contains the code to accept the raw contents of
// an sgf (saved Go game file) and create a board and allow the user to step back and
// forth through the contents of the game.

$( document ).ready( function()
{
	// The url of the sgf file data
	var url = '/sgfserver.php';
	
	// A global variable to store the go game data
	window.goGame = false;

	// Get the game data from the server and parse it into javascript structures
	loadSGF( url, function( data )
	{
		window.goGame = parseSGFTree( data );
/*		for( var n in window.goGame )
		{
			for( var m in window.goGame[n] )
			{
				console.log( m + ' = ' + window.goGame[n][m] );
			}// End for m
			console.log( 'end' );
		}// End for n
*/
	} );
} );