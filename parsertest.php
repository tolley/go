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
	$( '#goban' ).gogame( { 'url': '/games/tolley.sgf', 
				'format': 'sgf',
				'nextBtn': '#next',
				'previousBtn': '#previous',
				'lastBtn': '#last',
				'firstBtn': '#first',
				'chatWindow': '#chatWindow',
				'gameInfo': '#gameinfo',
				'whiteInfo': '#player_whilte_info',
				'blackInfo': '#player_black_info' } );
} );
</script>

</head>

<body>

<div style="width: 900px;">
	<div style="float:right;">
	
	<h2>What am I looking at?</h2>
	
	<p style="width:400px;">
	This is a demo page for a <a href="http://en.wikipedia.org/wiki/Go_(game)">go board</a> plugin for jQuery.  
	This plugin will let users specify a saved game file on the server, and a flag to indicate the file format.
	It will fetch the file from the server, parse it into javascript objects, and provide input options that 
	will let the user step back and forth through the game.
	</p>

	<div style="">Here's what the page javascript looks like:</div>
	<pre>
$( document ).ready( function()
{
	$( '#goban' ).gogame( { 'url': '/games/tolley.sgf', 
				'format': 'sgf',
				'nextBtn': '#next',
				'previousBtn': '#previous',
				'lastBtn': '#last',
				'firstBtn': '#first',
				'chatWindow': '#chatWindow',
				'gameInfo': '#gameinfo',
				'whiteInfo': '#player_whilte_info',
				'blackInfo': '#player_black_info' } );
} );
	</pre>
	
	</div>
	
	<div style="border:solid 1px #000; width: 420px;">
		<div id="gameinfo" style="width: 419px;">
		</div>
		
		<center>
		<div id="goban">
		</div>
		</center>

		<div>
			<div id="player_whilte_info" style="width: 50%; float: left;">
			</div>
			<div id="player_black_info" style="width: 49%; float: right;">
			</div>
		</div>
		
		<textarea id="chatWindow" style="width:420px; height:75px;"></textarea>
		<br />
		
		<div style="text-align: center;">
			<button id="first">First</button>
			<button id="previous">Previous</button>
			<button id="next">Next</button>
			<button id="last">Last</button>
		</div>
	</div>
</div>

</body>

</html>