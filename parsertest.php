<html>

<head>

<title>A test file for the javascript sgf parsing object</title>

<script type="text/javascript" src="/jquery.js"></script>
<script type="text/javascript" src="/jquery.gogame.js"></script>
<script type="text/javascript" src="/jquery.goboard.js"></script>
<script type="text/javascript" src="/jquery.sgfparser.js"></script>

<script type="text/javascript">

$( document ).ready( function()
{
	// The url of the sgf file data
	var url = '/tolley.sgf';

	var goban = $( '#goban' ).gogame( { 'url': url, 'format': 'sgf' } );
	
	$( '#next' ).click( function()
	{
		for( var n in goban )
			console.log( n );
	} );
	$( '#previous' ).click( function(){  goban.previous(); } );
	
/*	// A global variable to store the go game data
	window.goGame = false;

	// Get the game data from the server and parse it into javascript structures
	$.loadSGF( url, function( gameTree )
	{
		window.goGame = gameTree;
		console.log( window.goGame );
	} );
	*/
} );
</script>

</head>

<body>

<div id="goban">
</div>

<br />

<button id="next">Next</button>
<button id="previous">Previous</button>
<br />

</body>

</html>