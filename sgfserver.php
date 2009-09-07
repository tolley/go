<?
// Author : Chris Tolley
// Date   : 09/03/2009
// Desc   : A test file that will serve up the text data found inside a hardcoded sgf file

// Create the path to our go sgf files
$path = dirname( __FILE__ ) . '/';

/*
$files = array(
	$path . 'tolley.sgf',
	$path . 'tolley2.sgf',
	$path . 'White-Black.sgf',
	$path . 'escaped.sgf'
);
*/

echo file_get_contents( $path . 'tolley.sgf' );

?>