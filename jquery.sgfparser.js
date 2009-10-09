// Author : Chris Tolley
// Date   : 09/07/2009
// Desc   : This file contains a jquery plugin that makes it possible to fetch and parse
//	    an sgf file from a given url on the server.  It is also responsible for generating
//	    go stone objects, passing those objects to the board to generate deltas between turns,
//	    and setting any static game properties avaiable.  It must then let the board know 
//	    when all game info has been entered.

// Requirements: jQuery (ajax calls)

;( function( $ ){

$.extend( {

	// Takes in a url of an sgf file.  It GET's the raw sgf data, parses it into javascript object,
	// and passes that to callback.  callback must take in a single parameter, which will be the game tree data
	loadSGF : function( url, callback )
	{
		// Takes in a string of game tree data (including leading and trailing ()'s and returns
		// an array containing each node.  Each node is an array of properties
		function parseSGFTree( treeData )
		{
			var game = false;
			treeData = $.trim( treeData );
		
			var length = treeData.length;
		
			// Verify that the tree has the opening and closing ()'s
			if( treeData.charAt( 0 ) == '(' && treeData.charAt( treeData.length - 1 ) == ')')
			{
				// Remove the opening and closing parens
				treeData = treeData.substr( 1, treeData.length - 2 );
				treeData = $.trim( treeData );
				
				// Extract the individual nodes from the game tree
				var nodes = new Array();
		
				// Preview infinite loops while I develop
				while( treeData.length > 0 )
				{
					var result = extractNode( treeData );
					
					// If we found a node
					if( result.node )
					{
						// Add the new node onto the array of nodes
						nodes.push( result.node );
						
						// Set data equal to the data minus the node calculated in extractNode
						treeData = result.data;
					}// End if
				}// End while
		
				// Foreach node, parse out it's properties
				var properties = new Array();
				for( var n in nodes )
				{
					properties.push( extractNodeProperties( nodes[n] ) );
				}// End for each node
				
				game = properties;
			}// End if
			else
				alert( "Invalid game tree found in " + treeData );
			
			return game;
		}// End function parseSGFTree
		
		// Extracts the next full node from the passed in sgf data
		// It also removes the contents of the extracted node from data
		function extractNode( data )
		{
			// The return value
			var result = { node: false };
		
			data = $.trim( data );
			var length = data.length;
		
			// If the data doesn't start with a semicolon, then it's not valid data
			if( data.charAt(0) == ';' && length > 1 )
			{
				// Find the semicolon that designates the start of the next property.
				// If we we can't find one, then treat data as a single node
				data = $.trim( data.substr( 1 ) );
				var end = nonnestedFindPos( ';', data );
		
				// If we didn't find an end, assume the entire string is a node
				if( end === false )
					end = length;
		
				// Extract the node data minus the leading semicolon
				result.node = $.trim( data.substr( 0, end ) );
				
				// Remove the node data from the data string including the leading semicolon
				result.data = $.trim( data.substr( end ) );
			}// End if
			else
				alert( "Invalid node found in " + data );
			
			return result;
		}// End function extractNode
		
		// Takes in a node and returns an array containing the extracted properties and their sub nodes.
		function extractNodeProperties( node )
		{
			// The return value
			var properties = new Array();
			
			// The name of the most recently extracted property
			var propertyName = false;
			
			node = $.trim( node );
		
			// While there's another property/value pair
			while( node.length > 0 )
			{		
				// If the first character in the node is opening an new sub tree
				if( node.charAt( 0 ) == '(' )
				{
					// Find the end of the sub tree.  Need to do a substr below because
					// we are passing in the first ( without it, and then the nested strpos function
					// can't find the closing )
					subtreeEnd = nonnestedFindPos( ')', node.substr( 1 ) ) + 1;
					if( subtreeEnd !== false )
					{
						// Extract the sub tree plus the closing ) from the node
						subTreeData = node.substr( 0, subtreeEnd + 1 );
						node = $.trim( node.substr( subtreeEnd + 1 ) );
						
						// Parse the subtree data into javascript structures
						subTree = parseSGFTree( subTreeData );
						
						// Add the sub tree to the properties
						if( ! properties['subtrees'] )
							properties['subtrees'] = new Array();
						properties['subtrees'].push( subTree );
					}// End if
					else
						node = '';
				}// End if
				else if( node.charAt( 0 ) == '[' )
				{
					// Otherwise, if the first character is the property opening, just use the previous
					// property name.
					
					// Note: I don't think this is actually allowed in an sgf file, but I keep seeing properties
					// like TW[ee][ej][kl] and I can't figure out what they are, so until I do, I'll just parse
					// them by using the previous property name
					
					// Remove the opening [ from the property value
					node = $.trim( node.substr( 1 ) );

					// Find the closing ] for the property value
					var end = nonnestedFindPos( ']', node );
					
					// If we can't find the closing ], stop pressing this node
					if( end === false )
						node = '';
					else
					{
						// Otherwise, extract the property value and ] from the node
						var propertyValue = $.trim( node.substr( 0, end ) );
						node = $.trim( node.substr( end + 1 ) );
						
						// Add our property to the properties array
						if( ! ( properties[ propertyName ] instanceof Array ) )
						{
							var temp = new Array( properties[ propertyName ] );
							temp.push( propertyValue );
							properties[ propertyName ] = temp;
						}// End if
						else
							properties[ propertyName ].push( propertyValue );
					}// End else
				}// End else if
				else
				{
					// Otherwise, treat the next element as a normal property/value pair.
		
					// Find the end of the name of the property, or where it's value starts
					var propertyOpen = nonnestedFindPos( '[', node );
		
					// If there are no more nodes, kill the loop
					if( propertyOpen === false )
						node = '';		
					
					// Extract the property name from the node.  Also remove the property value's 
					// opening bracket from the node
					propertyName = $.trim( node.substr( 0, propertyOpen ) );
					node = $.trim( node.substr( propertyOpen + 1 ) );
			
					// Find the closing bracket in the properties value
					var end = nonnestedFindPos( ']', node );
					
					// If we didn't find an end, stop processing this node
					if( end === false )
						node = '';
			
					// Extract the property value from the node.  Also remove
					// the closing bracket from the node
					var propertyValue = $.trim( node.substr( 0, end ) );
					node = $.trim( node.substr( end + 1 ) );
					
					// If we have a comment property, unescape it
					if( propertyName.toUpperCase() == 'C' )
						propertyValue = unescapeComment( propertyValue );
					
					// Add our property to the return value
					properties[ propertyName ] = propertyValue;
				}// End else
			}// End while
		
			return properties;
		}// End function extractNodeProperties
		
		
		// Returns the position of the first occurence needle (a single char) found in haystack
		// that is not nested inside ()'s.  Returns false if it
		// can't find it
		function nonnestedFindPos( needle, haystack )
		{
			var length = haystack.length;
			if( length == 0 )
				return false;
		
			// Used to keep track of whether we are in nested parens or not
			var parens = 0;
			
			// Set to position of the needle once we find it.
			var pos = false;
			
			for( var n = 0; ( n < length ) && ( pos === false ); n++ )
			{
				switch( haystack.charAt( n ) )
				{
					// Check for our needle first
					case needle:
						//If we aren't in a set of nested parens
						if( parens == 0 )
							pos = n;
						break;
					case '(':
						parens++;
						break;
					case ')':
						parens--;
						break;
					case '\\':
						n++;
						break;
					default:
						break;
				}// End switch
			}// End for n
			
			return pos;
		}// End function nonnestedFindPos
		
		// Unescapes a comment string and returns it
		function unescapeComment( str )
		{
			str.replace( '\\]', ']' );
			return str;
		}// End function unescapeComment
	
		// Call the server to get the requested sgf file
		$.get( url, function( data )
		{
			var gameTree = parseSGFTree( data );
			
			// Define the sgf File object
			var sgfFile = new Object( 
			{
				// The actual game data
				gameTree: gameTree,
				
				// The display elements for the board
				board: false,
				
				// A place holder that keeps track of which node in the game tree we are on.
				currentNode: 0,
				
				// The number of handicap stones in this game files
				numHandicapStones: 0,
				
				// Sets the gameTree data
				setGameTreeData: function( gameTree ){ this.gameTree = gameTree; },
				
				// Returns the gameTree data
				getGameTreeData: function(){ return this.gameTree; },

				// Loops over each node in the sgf file and sets all properties on the board, and
				// generates the list of delta's between turns.
				prepBoard: function( board )
				{
					if( ! board )
					{
						alert( 'No board found in prepBoard: board = ' + board );
						return;
					}// End if

					this.board = board;
					
					// Loop over each node and each node's properties, applying any static board
					// properties to the board, and generating delta's between each move
					for( var node = 0; node <= this.gameTree.length; ++node )
					{
						// Create a blank stone, so we can set the properties here
						var goStone = this.board.getBlankStone();
						goStone.number = node + this.numHandicapStones;

						// Make sure the board size was set in the first node
						if( node == 1 && ! this.board.size )
						{
							alert( 'Board size not found in the first node, unable to generate deltas' );
							return;
						}// End if

						for( var property in this.gameTree[node] )
						{
							// Switch based on the property name
							switch( property )
							{
								// Black makes a move
								case 'B':
									if( ! goStone.x && ! goStone.y && ! goStone.action )
									{
										// Get the coordinates of the move and send them to the board
										goStone.x = this.gameTree[node][property].charAt( 0 );
										goStone.y = this.gameTree[node][property].charAt( 1 );
										goStone.color = 'b';
										goStone.action = 'place';
										
										// Translate the go stone coordinates from alpha to numeric
										goStone.x = parseInt( goStone.x.charCodeAt( 0 ) ) - 97;
										goStone.y = parseInt( goStone.y.charCodeAt( 0 ) ) - 97;
									}// End if
									else
										alert( 'Two stones placed in node '  + node );
									break;
									
								// White makes a move
								case 'W':
									if( ! goStone.x && ! goStone.y && ! goStone.action )
									{
										// Get the coordinates of the move and send them to the board
										goStone.x = this.gameTree[node][property].charAt( 0 );
										goStone.y = this.gameTree[node][property].charAt( 1 );
										goStone.color = 'w';
										goStone.action = 'place';
										
										// Translate the go stone coordinates from alpha to numeric
										goStone.x = parseInt( goStone.x.charCodeAt( 0 ) ) - 97;
										goStone.y = parseInt( goStone.y.charCodeAt( 0 ) ) - 97;
									}// End if
									else
										alert( 'Two stones placed in node '  + node );
									break;

								// A player made a comment
								case 'C':
									if( goStone.comments && goStone.comments.length > 0 )
										goStone.comments = goStone.comments + "\n" + $.trim( this.gameTree[node][property] );
									else
										goStone.comments = $.trim( this.gameTree[node][property] );
									break;

								// Game property, the size of the board.
								case 'SZ':
									this.board.setBoardSize( this.gameTree[node][property] );
									break;
								
								// Game board property, the number of handicap stones
								case 'HA':
									break;
								
								// Game board property, the position of the handicap stones
								case 'AB':
									// If the handicap stones are not in the first node of the tree
									if( node != 0 )
									{
										alert( 'Found handicap stones in node ' + node + '. Exiting');
										return;
									}// End if
									// Get a short cut to the list of handicap stones
									var handicapList = this.gameTree[node][property];
									
									// Set the number of handicap stones
									// The number of handicap stones in this game files
									this.numHandicapStones = handicapList.length;
									
									// Foreach handicap stone, create a stone object
									var stoneObjects = new Array();
									for( var n in handicapList )
									{
										// Get a blank stone and fill in the details
										var handicapStone = this.board.getBlankStone();
										handicapStone.color = 'b';
										handicapStone.action = 'place';
										handicapStone.x = handicapList[n].charAt( 0 );
										handicapStone.y = handicapList[n].charAt( 1 );
										handicapStone.number = n;
										
										// Translate the go stone coordinates from alpha to numeric
										handicapStone.x = parseInt( handicapStone.x.charCodeAt( 0 ) ) - 97;
										handicapStone.y = parseInt( handicapStone.y.charCodeAt( 0 ) ) - 97;
										
										stoneObjects.push( handicapStone );
									}// End for n
									
									// Give the handicap stones to the board
									this.board.setHandicapStones( stoneObjects );
									break;

								default:
									// Uncomment this to see all the properties I still have to implement
//									console.log( 'Unrecognized property ' + property + ' = ' + this.gameTree[node][property] );
									break;
							}// End switch property name
						}// End for property
						
						// If we have a stone, add it to the board
						if( goStone.action )
						{
							// If this is a legal move
							if( this.board.isLegalPlay( goStone ) )
								this.board.calculateTurnDelta( node, goStone );
						}// End if
					}// End for each node
								
					// Let the board know we are finished calculating the turn delta's
					this.board.onDeltasFinished();
				}
			} );

			// Pass the sgf file to the callback function
			callback( sgfFile );
		} );
	}// End function loadSGF
} );

})(jQuery);
