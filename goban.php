<html>

<head>

<title>A sandbox for building a jquery goban plugin</title>

<script type="text/javascript" src="/jquery.js"></script>
<script type="text/javascript" src="/jquery.goban.js"></script>
<link rel="stylesheet" type="text/css" href="/jquery.goban.css"/>

<script type="text/javascript">

// Set up the document onload function
$( document ).ready( function()
{
	$( '#goban' ).goban( { size: 13 } );
} );

</script>

</head>

<body>

<div id="goban">
Goban should be here.
</div>

</body>

</html>