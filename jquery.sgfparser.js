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
					var nodeProperties = extractNodeProperties( nodes[n] );
					
					// If we have subtrees, pull the first subtree out and add it to the
					// main branch
					if( nodeProperties['subtrees'] && nodeProperties['subtrees'].length > 0 )
					{
						var firstTree = nodeProperties['subtrees'].pop();
						properties.push( nodeProperties );
						
						for( var node = 0; node <= firstTree.length; ++node )
							properties.push( firstTree[node] );	
					}// End if
					else
						properties.push( nodeProperties );
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
					
					// Create our player objects
					this.board.playerBlack = this.board.getBlankPlayerObj( 'white' );
					this.board.playerWhite = this.board.getBlankPlayerObj( 'black' );
					
					// Loop over each node and each node's properties, applying any static board
					// properties to the board, and generating delta's between each move
					for( var node = 0; node <= this.gameTree.length - 1; ++node )
					{
						// Get a blank turn object to fill in and pass to the board to calculate the deltas
						var turnObj = this.board.getBlankTurnObject();
						
						turnObj = this.parseGameNode( this.gameTree[node], turnObj );

						// Set the turn object in the board
						this.board.setTurnObj( turnObj );
					}// End for each node
					
					// Let the world know the game was successfully parsed
					this.board.loaded = true;
					
					console.log( this.board );
				},// End prepBoard
				
				// Applies a node from the gametree data to a turn object and returns the turn object
				parseGameNode: function( node, turnObj )
				{
					// Get an empty stone object from the board
					var goStone = this.board.getBlankStone();

					// Loop over each property in the node
					for( var property in node )
					{
						// Switch based on the property name
						switch( property )
						{
							// For a list of properties see: http://www.red-bean.com/sgf/properties.html
							
							// Begin MOVE properties //////////////////////////////////////////////
							case 'KO':
								// This value tells the viewer to play a given stone even if it's illegal
								// but we don't need to do that cause we already allow illegal moves
								break;
							
							// Sets the move number, used for printing
							case 'MN':
								if( parseInt( node[property] ) != NaN )
									goStone.number = parseInt( node[property] );
								break;
	
							// Black makes a move
							case 'B':
								if( ! goStone.x && ! goStone.y && ! goStone.action )
								{
									// Get the coordinates of the move and send them to the board
									goStone.x = node[property].charAt( 0 );
									goStone.y = node[property].charAt( 1 );
									goStone.color = 'b';
									
									// Translate the go stone coordinates from alpha to numeric
									goStone.x = parseInt( goStone.x.charCodeAt( 0 ) ) - 97;
									goStone.y = parseInt( goStone.y.charCodeAt( 0 ) ) - 97;
									
									// If the coordinates of the stone are out of range, treat it as a pass
									if( goStone.x == this.board.size && goStone.y == this.board.size )
										goStone.action = 'pass';
									else
										goStone.action = 'place';
								}// End if
								else
									alert( 'Two stones placed in node '  + node );
								break;
								
							// White makes a move
							case 'W':
								if( ! goStone.x && ! goStone.y && ! goStone.action )
								{
									// Get the coordinates of the move and send them to the board
									goStone.x = node[property].charAt( 0 );
									goStone.y = node[property].charAt( 1 );
									goStone.color = 'w';
									
									// Translate the go stone coordinates from alpha to numeric
									goStone.x = parseInt( goStone.x.charCodeAt( 0 ) ) - 97;
									goStone.y = parseInt( goStone.y.charCodeAt( 0 ) ) - 97;
									
									// If the coordinates of the stone are out of range, treat it as a pass
									if( goStone.x == this.board.size && goStone.y == this.board.size )
										goStone.action = 'pass';
									else
										goStone.action = 'place';
								}// End if
								else
									alert( 'Two stones placed in node '  + node );
								break;
	
							// End MOVE properties //////////////////////////////////////////////////
							
							// Begin SETUP properties ///////////////////////////////////////////////
							// Adds a list of black stones to the board
							case 'AB':								
								// Get a short cut to the list of stones
								var stoneList = node[property];
								
								// Foreach stone, create a stone object
								var stoneObjects = new Array();
								for( var n in stoneList )
								{
									// Get a blank stone and fill in the details
									var tempStone = this.board.getBlankStone();
									tempStone.color = 'b';
									tempStone.action = 'place';
									tempStone.x = stoneList[n].charAt( 0 );
									tempStone.y = stoneList[n].charAt( 1 );
									
									// Translate the go stone coordinates from alpha to numeric
									tempStone.x = parseInt( tempStone.x.charCodeAt( 0 ) ) - 97;
									tempStone.y = parseInt( tempStone.y.charCodeAt( 0 ) ) - 97;
									
									stoneObjects.push( tempStone );
								}// End for n
								
								// Add the list of black stones to the turn
								turnObj.additionalBlackStones = stoneObjects;
								break;
							
							// Clears the given point on the board
							case 'AE':
								break;
							
							// Adds a list of white stones to the board
							case 'AW':
								// Get a short cut to the list of stones
								var stoneList = node[property];
								
								// Foreach stone, create a stone object
								var stoneObjects = new Array();
								for( var n in stoneList )
								{
									// Get a blank stone and fill in the details
									var tempStone = this.board.getBlankStone();
									tempStone.color = 'w';
									tempStone.action = 'place';
									tempStone.x = stoneList[n].charAt( 0 );
									tempStone.y = stoneList[n].charAt( 1 );
									
									// Translate the go stone coordinates from alpha to numeric
									tempStone.x = parseInt( tempStone.x.charCodeAt( 0 ) ) - 97;
									tempStone.y = parseInt( tempStone.y.charCodeAt( 0 ) ) - 97;
									
									stoneObjects.push( tempStone );
								}// End for n
								
								// Add the list of white stones to the turn
								turnObj.additionalWhiteStones = stoneObjects;
								break;
							
							// Tells the user who's turn it is to play, used in problems and such
							case 'PL':
								if( node[property] == 'B' )
									turnObj.addComment( 'Black to play' );
								else
									turnObj.addComment( 'White to play' );
								break;
							// End SETUP properties ///////////////////////////////////////////////
							
							// Begin NODE ANNOTATION properties ///////////////////////////////////
							// A player made a comment
							case 'C':
								turnObj.addComment( node[property] );
								break;
							
							// Designates this node as an even position
							case 'DM':
								turnObj.addComment( 'The position is even.' );
								break;
							
							// Designates this node as good for black
							case 'GB':
								turnObj.addComment( 'This is good for black.' );
								break;
							
							// Designages this node as good for white
							case 'GW':
								turnObj.addComment( 'This is good for white.' );
								break;
							
							// Designates this node as a hotspot
							case 'HO':
								turnObj.addComment( 'This is a hotspot for both white and black.' );
								break;
							
							// Designates a name for this node
							case 'N':
								turnObj.addComment( 'Node: ' + node[property] );
								break;								
							
							// Designates that this position is unclear
							case 'UC':
								turnObj.addComment( 'This position is unclear.' );
								break;
							
							// Designates a value for this node
							case 'V':
								turnObj.addComment( 'This is worth ' + node[property] );
								break;
	
							// End NODE ANNOTATION properties /////////////////////////////////////
							
							// Begin MOVE ANNOTATION properties ///////////////////////////////////
							// The move played is bad
							case 'BM':
								if( goStone.color == 'w' )
									turnObj.addComment( 'This is a bad move for white.' );
								else
									turnObj.addComment( 'This is a bad move for black.' );
								break;
							
							// The move is doubtful
							case 'DO':
								if( goStone.color == 'w' )
									turnObj.addComment( 'This is a doubtful move for white.' );
								else
									turnObj.addComment( 'This is a doubtful move for black.' );
								break;
							
							// The move is an interesting one
							case 'IT':
								if( goStone.color == 'w' )
									turnObj.addComment( 'This is an interesting move by white.' );
								else
									turnObj.addComment( 'This is an interesting move by black.' );
								break;
							
							// The move is a tesuji
							case 'TE':
								if( goStone.color == 'w' )
									turnObj.addComment( 'This is a tesuji for white.' );
								else
									turnObj.addComment( 'This is a tesuji for black.' );
								break;
								
							// End MOVE ANNOTATION properties /////////////////////////////////////
								
/*							// Begin MARKUP properties ////////////////////////////////////////////
							// Marks the given points with a circle
							case 'CR':
								break;

							// Dims out the given points
							case 'DD':
								break;

							// Writes the given text to the board around the current stone
							case 'LB':
								// Foreach point, split by : and add the markup
								break;								

							// Marks the given points with an X
							case 'X':
								break;

							// End MARKUP properties //////////////////////////////////////////////
*/
							// Begin ROOT properties //////////////////////////////////////////////
							// Defines the game type.  If it's not a go game, exit
							case 'GM':
//								if( this.gameTree[node][property] != 1 )
//								{
//									alert( 'Unable to parse game file: Not a go game' );
//									return false;
//								}// End if
								break;

							// The size of the board.
							case 'SZ':
								if( parseInt( node[property] ) != NaN && node == 0 )
									this.board.boardSize = node[property];
								break;
							
							// End ROOT properties ////////////////////////////////////////////////


							// Begin GAMEINFO properties ////////////////////////////////////////
							// The black player's rank
							case 'BR':
								this.board.playerBlack.rank = node[property];
								break;

							// The black player's team's name
							case 'BT':
								this.board.playerBlack.teamName = node[property];
								break;

							// The copyright info related to the game
							case 'CP':
							case 'CoPyright':
							case 'COPYRIGHT':
							case 'copyright':
								this.board.copyrightInfo = node[property];
								break;

							// The date / time that this game was played
							case 'DT':
								// this.board.dateTime = dateFormat(  );
								this.board.dateTime = node[property];
								break;

							// The event/venue where this game was played
							case 'EV':
								this.board.event = node[property];
								break;

							// The name of the game
							case 'GN':
								this.board.gameName = node[property];
								break;

							// Extra info about this game
							case 'GC':
								this.board.gameInfo = node[property];
								break;
							
							// Some information about the opening of this game
							case 'ON':
								this.board.openingType = node[property];
								break;
							
							// The overtime (byo-yomi) method used in this game
							case 'OT':
								this.board.overtime = node[property];
								break;
							
							// The black player's name
							case 'PB':
								this.board.playerBlack.name = node[property];
								break;
							
							// The location/server where this game was played
							case 'PC':
								this.board.location = node[property];
								break;

							// The white player's name
							case 'PW':
								this.board.playerWhite.name = node[property];
								break;

							// The final result of the game
							case 'RE':
								this.board.result = node[property];
								break;
								
							// The round number and type (final, semifinal) of this game
							case 'RO':
								this.board.roundInfo = node[property];
								break;
							
							// The rules set this game was played under
							case 'RU':
								this.board.rulesSet = node[property];
								break;
							
							// The source of the this game (book, journal, etc)
							case 'SO':
								this.board.source = node[property];
								break;
							
							// The time limit for this game
							case 'TM':
								var timeLimit = parseInt( node[property] );
								if( timeLimit != NaN )
								{
									var minutes = ( Math.floor( timeLimit / 60 ) ).toString();
									var seconds = ( timeLimit % 60 ).toString();

									if( seconds.length == 1 )
										seconds = '0' + seconds;
									
									this.board.timeLimit = minutes + ':' + seconds;
								}// End if
								break;
							
							// The person or server that created the game file
							case 'US':
								this.board.author = node[property];
								break;
							
							// The white player's rank
							case 'WR':
								this.board.playerWhite.rank = node[property];
								break;
							
							// The white player's team's name
							case 'WT':
								this.board.playerWhite.teamName = node[property];
								break;
							// End GAME properties ////////////////////////////////////////


							// Begin TIMING properties ////////////////////////////////////////
							// The time left for black after this move was played, in seconds
							case 'BL':
								var timeRemaining = parseInt( node[property] );
								if( timeRemaining != NaN )
								{
									// Parse the int into a nice looking string and set it in the turn object
									var minutes = ( Math.floor( timeRemaining / 60 ) ).toString();
									var seconds = ( timeRemaining % 60 ).toString();

									if( seconds.length == 1 )
										seconds = '0' + seconds;
									
									turnObj.timeRemaining = minutes + ':' + seconds;
								}// End if
								break;

							// The number of moves left for black in this byo-yomi period
							case 'OB':
								turnObj.stonesRemaining = parseInt( node[property] );
								break;

							// The number of moves left for white in this byo-yomi perioid
							case 'OW':
								turnObj.stonesRemaining = parseInt( node[property] );
								break;

							// The time left for white after this move was played, in seconds
							case 'WL':
								var timeRemaining = parseInt( node[property] );
								if( timeRemaining != NaN )
								{
									// Parse the int into a nice looking string and set it in the turn object
									var minutes = ( Math.floor( timeRemaining / 60 ) ).toString();
									var seconds = ( timeRemaining % 60 ).toString();

									if( seconds.length == 1 )
										seconds = '0' + seconds;
									
									turnObj.timeRemaining = minutes + ':' + seconds;
								}// End if
								break;								
							// End TIMGING properties //////////////////////////////////////////
							
							// Begin GM[1] properties /////////////////////////////////////////
							// The number of handicap stones.
							case 'HA':
								this.board.numHandicapStones = node[property];
								break;
							
							// Defines the komi for this game
							case 'KM':
								komi = node[property];
								
								// Remove any trailing zeros from the komi value
								if( komi.length > 0 )
								{
									while( komi.charAt( komi.length - 1 ) == '0' && komi.length > 1 )
										komi = komi.substr( 0, komi.length - 1 );
									
									if( komi.length > 0 )
										this.board.komi = komi;
								}// End if
								break;
							
							// Specifies the black territory or area
							case 'TB':
								// Get a short cut to the list of territory
								var territoryList = node[property];
								
								// Foreach point of territory, create a stone object
								turnObj.territoryBlack = new Array();
								for( var n in territoryList )
								{
									// Create a structure to store the point of territory
									var point = { x: false, y: false };

									point.x = territoryList[n].charAt( 0 );
									point.y = territoryList[n].charAt( 1 );
									
									// Translate the go stone coordinates from alpha to numeric
									point.x = parseInt( point.x.charCodeAt( 0 ) ) - 97;
									point.y = parseInt( point.y.charCodeAt( 0 ) ) - 97;
									
									turnObj.territoryBlack.push( point );
								}// End for n
								break;
								
							// Specifies the white territory or reaa
							case 'TW':
								// Get a short cut to the list of territory
								var territoryList = node[property];
								
								// Foreach point of territory, create a stone object
								turnObj.territoryWhite = new Array();
								for( var n in territoryList )
								{
									// Create a structure to store the point of territory
									var point = { x: false, y: false };

									point.x = territoryList[n].charAt( 0 );
									point.y = territoryList[n].charAt( 1 );
									
									// Translate the go stone coordinates from alpha to numeric
									point.x = parseInt( point.x.charCodeAt( 0 ) ) - 97;
									point.y = parseInt( point.y.charCodeAt( 0 ) ) - 97;
									
									turnObj.territoryWhite.push( point );
								}// End for n
								break;

							// End GM[1] properties ///////////////////////////////////////////

							default:
								// Uncomment this to see all the properties I still have to implement
//								console.log( 'Unrecognized property ' + property + ' = ' + this.gameTree[node][property] );
								break;
							}// End switch property name
						}// End for property
						
						// If we have a stone, add it to the turn
						if( goStone.action )
						{
							// Note: we need to check for legal plays here
							turnObj.stone = goStone;
						}// End if
					
					// Return the turn object
					return turnObj;
				}// End parseGameNode
			} );

			// Pass the sgf file to the callback function
			callback( sgfFile );
		} );
	}// End function loadSGF
} );

})(jQuery);
