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
	$( '#goban' ).gogame( { 'url': '/handicap.sgf', 
				'format': 'sgf',
				'nextBtn': '#next',
				'previousBtn': '#previous',
				'chatWindow': '#chatWindow' } );
} );
</script>

</head>

<body>

<div style="width: 900px;">
	<div style="float:right;">
	
	<h2>What am I looking at?</h2>
	
	<p style="width:400px;">
	This is a demo page for a go board plugin for jQuery.  This plugin will let users
	specify a saved game file on the server, and a flag to indicate the file format.
	It will fetch the file from the server, parse it into javascript objects, and provide 
	input options that will allow the user to step back and forth through the game.
	</p>

	<div style="">Here's what the page javascript looks like:</div>
	<pre>
$( document ).ready( function()
{
	$( '#goban' ).gogame( { 'url': '/handicap.sgf', 
				'format': 'sgf',
				'nextBtn': '#next',
				'previousBtn': '#previous',
				'chatWindow': '#chatWindow' } );
} );
	</pre>
	
	</div>
	
	<div id="goban">
	</div>
	
	<textarea id="chatWindow" style="width:382px; height:100px;"></textarea>
	<br />
	
	<button id="previous">Previous</button>
	<button id="next">Next</button>
	<br />
</div>

</body>

</html>