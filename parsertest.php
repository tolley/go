<html>

<head>

<title>A test file for the javascript sgf parsing object</title>

<link rel="stylesheet" type="text/css" href="/jquery.gogame.css"/>

<script type="text/javascript" src="/jquery.js"></script>
<script type="text/javascript" src="/jquery.gogame.js"></script>
<script type="text/javascript" src="/jquery.goboard.js"></script>
<script type="text/javascript" src="/jquery.sgfparser.js"></script>

<script type="text/javascript">

$( document ).ready( function()
{
	// The url of the sgf file data
	var url = '/tolley2.sgf';

	// Create the board image
	var goban = $( '#goban' ).gogame( { 'chatWindow': '#chatWindow', 
					    'url': url, 
					    'format': 'sgf' } );
	
	// Plug into the UI hooks
	$( '#next' ).click( function()
	{
		goban.goGameNext();
	} );
	
	$( '#previous' ).click( function(){ goban.goGamePrevious(); } );
} );
</script>

</head>

<body>

<div id="goban">
</div>

<br />

<textarea id="chatWindow" style="width:300px; height:150px;"></textarea>

<button id="next">Next</button>
<button id="previous">Previous</button>
<br />

</body>

</html>