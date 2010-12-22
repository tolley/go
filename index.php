<?
// Create the path to our go sgf files
$path = dirname( __FILE__ ) . '/games/';

$files = array(
	$path . 'tolley.sgf',
	$path . 'tolley2.sgf',
	$path . 'White-Black.sgf',
	$path . 'escaped.sgf'
);

foreach( $files as $file )
{
	$temp = loadSGF( $file );
	debug( $temp );
}// End foreach sgf file

// Takes in the path to an sgf file and returns an array with all the parts of the game
// parsed out in php structures
function loadSGF( $fileName )
{
	$game = false;
	if( file_exists( $fileName ) )
	{
		// Read in the game file and remore any new lines or tabs
		$gameData = trim( file_get_contents( $fileName ) );

		// Parse out the tree data
		$game = parseSGFTree( $gameData );
	}// End if
	else
		echo "Unable to find $fileName<br />";

	return $game;
}// End function loadSGF


// Takes in a string of game tree data (including leading and trailing ()'s and returns
// an array containing each node.  Each node is an array of properties
function parseSGFTree( $treeData )
{
	$game = false;
	$treeData = trim( $treeData );

	$length = strlen( $treeData );

	// Verify that the tree has the opening and closing ()'s
	if( $treeData{0} == '(' && $treeData{ strlen( $treeData ) - 1 } == ')')
	{
		// Remove the opening and closing parens
		$treeData = trim( substr( $treeData, 1, strlen( $treeData ) - 2 ) );
		
		// Extract the individual nodes from the game tree
		$nodes = array();
		while( strlen( $treeData ) > 0 )
			$nodes[] = extractNode( $treeData );

		// Foreach node, parse out it's properties
		$properties = array();
		foreach( $nodes as $node )
			$properties[] = extractNodeProperties( $node );
		
		$game = $properties;
	}// End if
	else
		echo "Invalid game tree found in $treeData<br />";

	return $game;
}// End function parseSGF

// Extracts the next full node from the passed in sgf data
// It also removes the contents of the extracted node from data
function extractNode( &$data )
{
	$data = trim( $data );
	$node = '';
	$length = strlen( $data );

	// If the data doesn't start with a semicolon, then it's not valid data
	if( $data{0} == ';' && $length > 1 )
	{
		// Find the semicolon that designates the start of the next property.
		// If we we can't find one, then treat data as a single node
		$data = trim( substr( $data, 1 ) );
		$end = nonnestedFindPos( ';', $data);
		
		if( $end === false )
			$end = $length;

		// Extract the node data minus the leading semicolon
		$node = trim( substr( $data, 0, $end ) );
		
		// Remove the node data from the data string including the leading semicolon
		$data = trim( substr( $data, $end ) );
	}// End if
	else
		echo "Invalid node found in $data<br />";
	
	return $node;
}// End function extractNode

// Takes in a node and returns an array containing the extracted properties and their sub nodes.
function extractNodeProperties( $node )
{
	// The return value
	$properties = array();
	
	// The name of the most recently extracted property
	$propertyName = false;
	
	$node = trim( $node );

	// While there's another property/value pair
	while( strlen( $node ) > 0 )
	{
		// If the first character in the node is opening an new sub tree
		if( $node{0} == '(' )
		{
			// Find the end of the sub tree.  Need to do a substr below because
			// we are passing in the first ( without it, and then the nested strpos function
			// can't find the closing )
			$subtreeEnd = nonnestedFindPos( ')', substr( $node, 1 ) ) + 1;
			if( $subtreeEnd !== false )
			{
				// Extract the sub tree plus the closing ) from the node
				$subTreeData = substr( $node, 0, $subtreeEnd + 1 );
				$node = trim( substr( $node, $subtreeEnd + 1 ) );
				
				// Parse the subtree data into PHP structures
				$subTree = parseSGFTree( $subTreeData );
				
				// Add the sub tree to the properties
				if( ! array_key_exists( 'subtrees', $properties ) )
					$properties['subtrees'] = array();
				$properties['subtrees'][] = $subTree;
			}// End if
			else
				$node = '';
		}// End if
		else if( $node{0} == '[' )
		{
			// Otherwise, if the first character is the property opening, just use the previous
			// property name.
			
			// Note: I don't think this is actually allowed in a sgf file, but I keep seeing properties
			// like TW[ee][ej][kl] and I can't figure out what they are, so until then, I'll just parse
			// them by using the previous property name
			
			// Remove the opening [ from the property value
			$node = trim( substr( $node, 1 ) );
			
			// Find the closing ] for the property value
			$end = nonnestedFindPos( ']', $node );
			
			// If we can't find the closing ], stop pressing this node
			if( $end === false )
				$node = '';
			else
			{
				// Otherwise, extract the property value and ] from the node
				$propertyValue = trim( substr( $node, 0, $end ) );
				$node = trim( substr( $node, $end + 1 ) );
				
				// Add our property to the properties array
				if( ! is_array( $properties[ $propertyName ] ) )
				{
					$temp = array( $properties[ $propertyName ] );
					array_push( $temp, $propertyValue );
					$properties[ $propertyName ] = $temp;
				}// End if
				else
					$properties[ $propertyName ][] = $propertyValue;
			}// End else
		}// End else if
		else
		{
			// Otherwise, treat the next element as a normal property/value pair.

			// Find the end of the name of the property, or where it's value starts
			$propertyOpen = nonnestedFindPos( '[', $node );

			// If there are no more nodes, kill the loop
			if( $propertyOpen === false )
			{
				$node = '';		
			}// End if
			
			// Extract the property name from the node.  Also remove the property value's 
			// opening bracket from the node
			$propertyName = trim( substr( $node, 0, $propertyOpen ) );
			$node = trim( substr( $node, $propertyOpen + 1 ) );
	
			// Find the closing bracket in the properties value
			$end = nonnestedFindPos( ']', $node );
			
			// If we didn't find an end, stop processing this node
			if( $end === false )
				$node = '';
	
			// Extract the property value from the node.  Also remove
			// the closing bracket from the node
			$propertyValue = trim( substr( $node, 0, $end ) );
			$node = trim( substr( $node, $end + 1 ) );
			
			// If we have a comment property, unescape it
			if( strtoupper( $propertyName ) == 'C' )
				$propertyValue = unescapeComment( $propertyValue );
			
			// Add our property to the return value
			$properties[ $propertyName ] = $propertyValue;
		}// End else
	}// End while

	return $properties;
}// End function extractNodeProperties

// Returns the position of the first occurence char found in str
// that is not nested inside ()'s.  Returns false if it
// can't find it
function nonnestedFindPos( $needle, $haystack )
{
	$length = strlen( $haystack );
	if( $length == 0 )
		return false;

	// Used to keep track of whether we are in nested parens or not
	$parens = 0;
	
	// Set to position of the needle once we find it.
	$pos = false;
	
	for( $n = 0; ( $n < $length ) && ( $pos === false ); $n++ )
	{
		switch( $haystack{$n} )
		{
			// Check for our needle first
			case $needle:
				//If we aren't in a set of nested parens
				if( $parens == 0 )
					$pos = $n;
				break;
			case '(':
				$parens++;
				break;
			case ')':
				$parens--;
				break;
			case '\\':
				$n++;
				break;
			default:
				break;
		}// End switch
	}// End for n
	
	return $pos;
}// End function nonnestedFindPos

// Unescapes a comment string and returns it
function unescapeComment( $str )
{
	$str = str_replace( '\\]', ']', $str );
	return $str;
}// End function unescapeComment

?>