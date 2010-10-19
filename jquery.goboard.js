// Author : Chris Tolley
// Date   : 09/09/2009
// Desc   : Contains the definition of a go board and the logic needed to 
//	    remove captured stones.  The board is created by the main jquery plugin.
//	    That plugin will also create the appropiate parser object, which will then
//	    set any static game properties, and call board.setTurnObj, for each turn, in order.
//	    Once the turn objects have been set up, the parser must call board.onParserFinish
//	    to let the board know that all available properties have been set and it can go ahead
//	    and generate the display

( function( $ ){

$.extend( {
	// Creates and returns a go board object.
	createGoBoard: function( options, elem )
	{
		options = $.extend( {
			size: 19,
			dim: 20,
			format: 'sgf',
			gameUrl: '',
			cellDim: 20
		}, options );

		// The go board object definition
		var goBoard = new Object( {
			// Set to true when the game file has been loaded, and is ready for commands
			loaded: false,

			// The internal representation of the state of the board
			internalBoard: false,
			
			// The size of the board
			size: false,
			
			// Keeps track of the turn we are on
			turnIndex: 1,
			
			// Keeps track of the move number.
			moveNumber: 0,

			// A reference to the chat window
			chatWindow: false,
			
			// A reference to the game info panel
			gameInfoPanel: false,
			
			// A reference to the html elements that make up the board display
			boardElem: false,

			// An array to hold the turn objects passed in from the parser
//			turnObjects: new Array(),
			
			// Stores the number of handicap stones
			numHandicapStones: '0',
			
			// Stores any copyright related information found in the game file
			copyrightInfo: '',
			
			// The date/time that this game was played
			dateTime: '',
			
			// The event/venue where this game was played
			event: '',
			
			// The name of the game
			gameName: '',
			
			// The final result of the game
			result: false,
			
			// The round number and type (final, semifinal) of this game
			roundInfo: '',
			
			// The rules set this game was played under
			rulesSet: '',
			
			// The komi set for this game
			komi: '',
			
			// The source of this game (book, journal)
			source: '',
			
			// Extra information about this game
			gameInfo: '',
			
			// The location/server where this game was played
			location: '',
			
			// The time limit for this game
			timeLimit: '',
			
			// The overtime method used in this game
			overtime: '',
			
			// Information about the opening moves of this game
			openingType: '',
			
			// The person or server that created this game file
			author: '',
			
			// The object that holds the black player's information
			playerBlack: false,
			
			// The element that holds the black player's information
			playerBlackPanel: false,
			
			// The object that holds the white player's information
			playerWhite: false,
			
			// The element that holds the white player's information
			playerWhitePanel: false,
			
			// The element that will hold the information about the most recently played stone
			turnInfoPanel: false,
			
			// A flag set to true when we are to mark the most recently played stone
			markCurrentStone: true,	
			
			// Used to keep track of the stone numbers.  Each stone gets a number when it is
			// used in setTurnObj.  Those numbers are used in the capturing logic
//			stoneId: 0,

			// Sets the size of the board
			setBoardSize: function( size )
			{
				// If the board has already been sized, then don't do it again
				if( this.internalBoard && this.size )
					return;
				
				// Make sure the size is an int
				size = parseInt( size );
			
				if( ! isNaN( size ) && size > 0 )
				{
					this.size = size;
					
					// Update the internal board
					this.internalBoard = new Array();
					for( var y = 0; y < size; ++y )
					{
						for( var x = 0; x < size; ++x )
						{
							if( ! ( this.internalBoard[x] instanceof Array ) )
								this.internalBoard[x] = new Array();
							this.internalBoard[x].push( 'e' );
						}// End for y
					}// End for x
				}// End if
			},
			
			// Called by the parser to get blank stone objects.  These are the stones
			// that will be passed back to the board attached to a turn object
			getBlankStone: function()
			{
				return { x: 	  false, 
					 y: 	  false, 
					 color:    false, 
					 action:   false, 
					 number:   false };
			},
			
			// Called by the parser to get an empty "turn" object.  These objects will
			// be populated by the parser and passed to the board object
			getBlankTurnObject: function()
			{
				return {
					// The stone played on the turn
					stone: false,
					
					// A list of stones, used to help set up problems and such
					additionalWhiteStones: false,
					additionalBlackStones: false,
					
					// Comments made this turn
					comments: false,
						
					// A list of stones to remove, this is calculated by the parser
					removeList: false,
					
					// The time left for the player that played a stone this turn
					timeRemaining: false,
					
					// The number of stones left in the current byo-yomi period fo rthe player that played a stone this turn
					stonesRemaining: false,
					
					// Marks white territory or area on the board
					territoryBlack: false,
					
					// Marks black territory or area on the board
					territoryWhite: false,
					 
					// Adds a comment to this turn object
					addComment: function( msg )
					{
						if( ! msg || msg.length == 0 )
							return;

						if( this.comments && this.comments.length > 0 )
							this.comments = this.comments + "\n" + $.trim( msg );
						else
							this.comments = $.trim( msg );
					}
				};
			},
   
   			// Creates an empty player object.  These objects are used by the parser to set the 
   			// player properties.
   			getBlankPlayerObj: function( color )
			{
				return { 
					color: color,
					name: 'N/A',
					rank: 'N/A',
					teamName: 'N/A',
					captures: 0,
					territoryCount: 0
				};
			},

			// Returns true if x/y is a valid play for color(w,b)
			isLegalPlay: function( stone )
			{
				// According to this: http://www.red-bean.com/sgf/properties.html
				// when the file tells you to play a stone, you play regardless of the board state.
				
				// If the stone has valid coordinates
				if( stone.x >= 0 && stone.x < this.size && stone.y >= 0 && stone.y < this.size )
					return true;
				else
					return false;
			},
			
			// Called by the parser object, in order of moves, to set the data for each move.
			// This is done in an effort to abstract the details between the loading of the data
			// and the usage of that data.
			setTurnObj: function ( turn, turnObj )
			{
/*				// If there is already a turn object for this turn, let the user know
				if( this.turnObjects[turn] )
				{
					alert( 'Duplicate turns set for turn ' + turn );
					return;
				}// End if
				
				// If there is was a stone played this turn, set it's id
				if( turnObj.stone )
					turnObj.stone.number = this.stoneId++;
				
				// Set the turn object on the list of turns
				this.turnObjects[turn] = turnObj;
*/
			},


			// Called during the viewing of the game.  It takes in the coordinates of a stone
			// after it was played.  This function returns a list of all captured stones and removes
			// those stones from the internal memory.  This function calls getCapturedStones
			removeStonesCapturedBy: function( x, y )
			{
				// The return value
				var captured = {};

				// Get the stone at x/y
				var currentStone = this.internalBoard[y][x];

				// Create a list of all neighboring stones
				var neighbors = new Array();
				if( this.internalBoard[y] && this.internalBoard[y][x + 1] )
				{
					if( typeof this.internalBoard[y][x + 1] == 'object' && 
						this.internalBoard[y][x + 1].color != currentStone.color )
						neighbors.push( this.internalBoard[y][x + 1] );
				}// End if
				
				if( this.internalBoard[y] && this.internalBoard[y][x - 1] )
				{
					if( typeof this.internalBoard[y][x - 1] == 'object' &&
						this.internalBoard[y][x - 1].color != currentStone.color )
						neighbors.push( this.internalBoard[y][x - 1] );
				}// End if
				
				if( this.internalBoard[y + 1] && this.internalBoard[y + 1][x] )
				{
					if( typeof this.internalBoard[y + 1][x] == 'object' && 
						this.internalBoard[y + 1][x].color != currentStone.color )
						neighbors.push( this.internalBoard[y + 1][x] );
				}// End if
				
				if( this.internalBoard[y - 1] && this.internalBoard[y - 1][x] &&
					this.internalBoard[y - 1][x].color != currentStone.color )
				{
					if( typeof this.internalBoard[y - 1][x] == 'object' )
						neighbors.push( this.internalBoard[y - 1][x] );
				}// End if
				
				// Foreach neighbor, if it's an enemy, check to see if it was captured
				while( neighbors.length > 0 )
				{
					var currentNeighbor = neighbors.pop();
					
					// If this stone hasn't already been captured
					if( ! captured[ currentNeighbor.number ] )
					{
						var capturedList = this.isCaptured( currentNeighbor.x, currentNeighbor.y );

						for( var number in capturedList )
							captured[number] = capturedList[number];
					}// End if
				}// End while

				// Foreach stone that needs to be removed, remove it from the internal board
				for( var number in captured )
				{
					var tempStone = captured[number];
					this.internalBoard[tempStone.y][tempStone.x] = 'e';					
				}// End for each captured stone

				return captured;
			},
			
			// Called while stepping through the game.  Returns a list of all stones connected 
			// to the stone at x/y that are captured.  This list should include x/y.  It returns false
			// if no stones are captured.  This function is called by removeCapturedStones
			isCaptured: function( x, y )
			{
				// If there is no stone at x/y, return false
				if( typeof this.internalBoard[y][x] != 'object' )
					return false;

				// Create a queue to hold the stones connected to our target stone
				var queue = new Array();
				
				// Create a list to hold the stones that have been checked.
				var checkedList = {};
				
				// A variable to keep track of the number of open liberties
				var openLibertyCount = 0;
				
				// Add our first node onto the queue and onto the checked list
				queue.push( this.internalBoard[y][x] );
				checkedList[ this.internalBoard[y][x].number ] = this.internalBoard[y][x];
				
				// While the queue isn't empty and we still haven't found any open liberties
				while( queue.length > 0 && openLibertyCount == 0 )
				{
					// Get the next stone off the queue
					var currentStone = queue.shift();
					
					// An array to store any adjacent stones for checking
					var neighbors = new Array();
					
					// Determine if any of the adjacent liberties are open.  If so, add them to 
					// the count, if not, if they are a friendly stone and we haven't checked it 
					// for open liberties, add it to the queue
					var x = currentStone.x;
					var y = currentStone.y;

					if( this.internalBoard[y] && this.internalBoard[y][x + 1] )
					{
						if( typeof this.internalBoard[y][x + 1] == 'object' )
							neighbors.push( this.internalBoard[y][x + 1] );
						else
							openLibertyCount++;
					}// End if
					
					if( this.internalBoard[y] && this.internalBoard[y][x - 1] )
					{
						if( typeof this.internalBoard[y][x - 1] == 'object' )
							neighbors.push( this.internalBoard[y][x - 1] );
						else
							openLibertyCount++;
					}// End if
					
					if( this.internalBoard[y + 1] && this.internalBoard[y + 1][x] )
					{
						if( typeof this.internalBoard[y + 1][x] == 'object' )
							neighbors.push( this.internalBoard[y + 1][x] );
						else
							openLibertyCount++;
					}// End if
					
					if( this.internalBoard[y - 1] && this.internalBoard[y - 1][x] )
					{
						if( typeof this.internalBoard[y - 1][x] == 'object' )
							neighbors.push( this.internalBoard[y - 1][x] );
						else
							openLibertyCount++;
					}// End if
					
					// Foreach neighbor stone, add any friendly neighbors that haven't been
					// checked for liberties to the queue, ignore all other stones
					while( neighbors.length > 0 )
					{
						var currentNeighbor = neighbors.shift();
						if( currentNeighbor.color == currentStone.color )
						{
							if( ! checkedList[ currentNeighbor.number ] )
							{
								checkedList[ currentNeighbor.number ] = currentNeighbor;
								queue.push( currentNeighbor );
							}// End if
						}// End if
					}// End while
				}// End while
				
				// If we found an open liberty, return false, otherwise, return the
				// list of stones
				if( openLibertyCount > 0 )
					return false;
				else
					return checkedList;
			},

			// To be called after the parser has finished setting all available game data, and 
			// turn objects.  This will generate the html elements to display the game
			onParserFinish: function()
			{
				// Calculate the max dimensions for the board plus coordinates
				var xMax = this.size + 2;
				var yMax = this.size + 2;
				
				// Set the board's display element container and class name
				this.boardElem = elem;
				$( this.boardElem ).addClass( 'goban' );
				
				// Set the style information on the element the board will display inside of
				this.boardElem.style.height = String( xMax * 20 ) + 'px';
				this.boardElem.style.width  = String( yMax * 20 ) + 'px';
		
				// Build each tile that will make up the board display
				for( var x = 0; x < xMax; ++x )
				{
					for( var y = 0; y < yMax; ++y )
					{
						// Build the base tile
						var newTile = document.createElement( 'div' );

						// Get the position for this stone
						var position = this.calculateTileCoordinates( x, y );
						newTile.style.left = position.left;
						newTile.style.top = position.top;

						var className = 'tile ';

						// Add the className that will give the tile the proper display
						// If we have a tile that is part of the UI (the side coordinates)
						if( x == 0 || y == 0 || x == xMax - 1 || y == yMax - 1 )
						{
							className += 'blank';
							
							// Calculate the innerHTML for the coordinates display
							newTile.innerHTML = this.calculateSideCoordinate( x, y );
						}// End if
						else
						{
							// Otherwise, we have a liberty tile and need to calculate the proper
							// image so that it displayes correctly
							className += this.calculateLibertyClass( x, y );
		
							newTile.innerHTML = '&nbsp;';
						}// End else

						newTile.className = className;
						this.boardElem.appendChild( newTile );
					}// End for y
				}// End for x
			},
			
 			// Moves the turn index forward one and applies the changes to the board display
			nextTurn: function()
			{
/*				// If this object isn't fully loaded, return false
				if( ! this.loaded )
					return false;

				this.turnIndex++;

				// If the index went out of range, put it back in range and return
				if( this.turnIndex >= this.turnObjects.length )
				{
					this.turnIndex = this.turnObjects.length - 1;
					return false;
				}// End if
				
				// Apply the current turn
				var currentTurn = this.turnObjects[ this.turnIndex ];
				
				// If there are white stones to add, add them
				if( currentTurn.additionalWhiteStones && currentTurn.additionalBlackStones.length > 0 )
				{
					for( var n in currentTurn.additionalWhiteStones )
					{
						var tempStone = currentTurn.additionalWhiteStones[n];

						this.addStoneToInternalBoard( tempStone );
						this.addStoneToDisplay( tempStone.x, tempStone.y, tempStone.color );
					}// End for n
				}// End if
				
				// If there are black stones to add, add them
				if( currentTurn.additionalBlackStones && currentTurn.additionalBlackStones.length > 0 )
				{
					for( var n in currentTurn.additionalBlackStones )
					{
						var tempStone = currentTurn.additionalBlackStones[n];

						this.addStoneToInternalBoard( tempStone );
						this.addStoneToDisplay( tempStone.x, tempStone.y, tempStone.color );
					}// End for n
				}// End if
				
				// If there was a stone played this turn, play it
				if( currentTurn.stone )
				{
					var currentStone = currentTurn.stone;
					
					// Increment the move number used in the move info panel
					this.moveNumber++;

					// If the time remaining is set in the turn, update the correct player's time remaining
					if( currentTurn.timeRemaining )
					{
						if( currentStone.color == 'b' )
							$( this.playerBlackPanel ).find( '.player_black_timeremaining' ).html( currentTurn.timeRemaining );
						else
							$( this.playerWhitePanel ).find( '.player_white_timeremaining' ).html( currentTurn.timeRemaining );
					}// End if

					// If the player didn't pass
					if( currentStone.action != 'pass' )
					{
						// Add the stone to the internal board, and to the display
						this.addStoneToInternalBoard( currentStone );
						this.addStoneToDisplay( currentStone.x, currentStone.y, currentStone.color );
						
						// If the remove list hasn't been calculated, do it now
						if( ! currentTurn.removeList )
							currentTurn.removeList = this.removeStonesCapturedBy( currentStone.x, currentStone.y );
	
						// Keep track of the number of stones captured
						var numCaptured = 0;
	
						// Foreach stone in the remove list, remove it from the board
						for( var number in currentTurn.removeList )
						{
							var tempStone = currentTurn.removeList[number];
							this.removeStoneFromInternalBoard( tempStone );
							this.removeStoneFromDisplay( tempStone.x, tempStone.y, tempStone.color );
							numCaptured++;
						}// End for each removed stone
							
						// Update the number of captured stones if we need to
						if( numCaptured > 0 )
							this.updateCaptureDisplay( currentStone.color, numCaptured );
						
						// If we are to mark the most recently played stone
						if( this.markCurrentStone )
						{
							// Find and remove any current stone markers
							$( elem ).find( '#current_play' ).each( function()
							{
								this.parentNode.removeChild( this );
							} );
	
							// Get a reference to the board cell at x,y
							var cell = this.getBoardCellAt( currentStone.x, currentStone.y );
	
							if( cell )
							{			
								// Create the new marker
								var marker = document.createElement( 'span' );
								marker.id = 'current_play';
								marker.innerHTML = '0';
								marker.className = ( currentStone.color == 'b' )? 'marker_blackstone': 'marker_whitestone';
	
								// Add the marker element to the cell
								cell.appendChild( marker );
							}// End if
						}// End if
					}// End if not pass
						
					// If the turn info panel was specified
					if( this.turnInfoPanel )
					{
						// Create a string with the details of the current play
						var turnInfoContent = 'Move ' + this.moveNumber + ': ';

						if( currentStone )
						{
							if( currentStone.color == 'b' )
								turnInfoContent += 'Black ';
							else
								turnInfoContent += 'White ';
							
							if( currentStone.action == 'pass' )
								turnInfoContent += ' Pass';
							else
							{
								// Translate the stone's coordinates into alpha numeric
								var x = currentStone.x + 1;
								if( x >= 9 ) x++;
								x = String.fromCharCode( x + 64 );

								var y = currentStone.y + 1;
								y = y - 20;
								if( y < 0 ) y = y * -1;

								turnInfoContent += x + ' ' + y;
							}// End else
						}// End if
						else
							turnInfoPanel += 'N/A';
						
						this.turnInfoPanel = $( options.turnInfo ).html( turnInfoContent );
					}// End if
				}// End if
				
				// If we have a comment, add it to the board
				if( currentTurn.comments && currentTurn.comments.length > 0 )
					this.addCommentToDisplay( currentTurn.comments );
				
				// Remove any mark up from the previous turn
				$( elem ).find( '.marker' ).each( function(){
					this.parentNode.removeChild( this );
				} );
				
				// If there is black territory marked this turn, build the markup for it
				if( currentTurn.territoryBlack && currentTurn.territoryBlack.length > 0 )
				{
					// Update the black player's territory count
					this.playerBlack.territoryCount += currentTurn.territoryBlack.length;

					for( var n in currentTurn.territoryBlack )
					{
						var point = currentTurn.territoryBlack[n];
						var cell = this.getBoardCellAt( point.x, point.y );
						
						var marker = document.createElement( 'div' );
						marker.className = 'marker territory_black';
						cell.appendChild( marker );
					}// End for n					
				}// End if
				
				// If there is black territory marked this turn, build the markup for it
				if( currentTurn.territoryWhite && currentTurn.territoryWhite.length > 0 )
				{
					// Update the white player's territory count
					this.playerWhite.territoryCount += currentTurn.territoryWhite.length;

					for( var n in currentTurn.territoryWhite )
					{
						var point = currentTurn.territoryWhite[n];
						var cell = this.getBoardCellAt( point.x, point.y );
						
						var marker = document.createElement( 'div' );
						marker.className = 'marker territory_white';
						cell.appendChild( marker );
					}// End for n	
				}// End if
				
				// If this is the last turn in the game, and we have a final score, show it
				if( this.turnIndex == this.turnObjects.length - 1 )
				{
					var comment = '';
					if( this.playerWhite.territoryCount > 0 || this.playerBlack.territoryCount > 0 )
					{
						comment += 'Black: Captures ' + this.playerBlack.captures + ', Territory ' + this.playerBlack.territoryCount;
						comment += ', Total ' + ( this.playerBlack.captures + this.playerBlack.territoryCount ) + '\n';
						comment += 'White: Captures ' + this.playerWhite.captures + ', Territory ' + this.playerWhite.territoryCount;
						comment += ', Total ' + ( this.playerWhite.captures + this.playerWhite.territoryCount ) + '\n';
					}// End if
					
					if( this.result )
						comment += 'Result: ' + this.result;

					this.addCommentToDisplay( comment );
				}// End if

				return true;
*/
			},
			
			// Moves the turn index back one and applies the changes to the board display
			previousTurn: function()
			{
/*				// If this object isn't fully loaded, return false
				if( ! this.loaded )
					return false;

				// If we are already on the first move, return
				if( this.turnIndex == -1 )
					return false;
	
				// Apply the changes for the current turn
				var currentTurn = this.turnObjects[ this.turnIndex ];
				
				// If there was a stone played this turn, remove it
				if( currentTurn.stone )
				{
					var currentStone = currentTurn.stone;
					
					// Deincrement the move number used in the move info panel
					this.moveNumber--;
					if( this.moveNumber < 0 )
						this.moveNumber = 0;
					
					// If the time remaining is set in the turn, update the correct player's time remaining
					if( currentTurn.timeRemaining )
					{
						if( currentStone.color == 'b' )
							$( this.playerBlackPanel ).find( '.player_black_timeremaining' ).html( currentTurn.timeRemaining );
						else
							$( this.playerWhitePanel ).find( '.player_white_timeremaining' ).html( currentTurn.timeRemaining );
					}// End if
					
					// If the player didn't pass
					if( currentStone.action != 'pass' )
					{
						// Remove the stone from the internal board, and the board's display element
						this.removeStoneFromInternalBoard( currentStone );
						this.removeStoneFromDisplay( currentStone.x, currentStone.y, currentStone.color );
						
						// Keep track of the number of stones captured
						var numCaptured = 0;
	
						// Foreach stone in the remove list, put it back on the board
						for( var number in currentTurn.removeList )
						{
							var tempStone = currentTurn.removeList[number];
							this.addStoneToInternalBoard( tempStone );
							this.addStoneToDisplay( tempStone.x, tempStone.y, tempStone.color );
							numCaptured++;
						}// End for each removed stone
						
						// Update the number of captured stones if we need to
						if( numCaptured > 0 )
							this.updateCaptureDisplay( currentStone.color, ( numCaptured * -1 ) );
						
						// If we are to mark the most recently played stone
						if( this.markCurrentStone )
						{
							// Find and remove any current stone markers
							$( elem ).find( '#current_play' ).each( function()
							{
								this.parentNode.removeChild( this );
							} );
	
							// Get the previously played stone, if there is one
							if( this.turnIndex > 1 )
							{
								var previousStone = this.turnObjects[ this.turnIndex - 1 ].stone;
	
								// Get a reference to the board cell at x,y
								var cell = this.getBoardCellAt( previousStone.x, previousStone.y );
	
								if( cell )
								{			
									// Create the new marker
									var marker = document.createElement( 'span' );
									marker.id = 'current_play';
									marker.innerHTML = '0';
									marker.className = ( previousStone.color == 'b' )? 'marker_blackstone': 'marker_whitestone';
	
									// Add the marker element to the cell
									cell.appendChild( marker );
								}// End if
							}// End if
						}// End if
					}// End if not pass				
				}// End if
				
				// Remove any mark up from the previous turn
				$( elem ).find( '.marker' ).each( function(){
					this.parentNode.removeChild( this );
				} );
				
				// If there are white stones to add, remove them
				if( currentTurn.additionalWhiteStones && currentTurn.additionalWhiteStones.length > 0 )
				{
					for( var n in currentTurn.additionalWhiteStones )
					{
						var tempStone = currentTurn.additionalWhiteStones[n];
						this.removeStoneFromInternalBoard( tempStone );
						this.removeStoneFromDisplay( tempStone.x, tempStone.y, tempStone.color );
					}// End for n
				}// End if

				// If there are black stones to add, remove them
				if( currentTurn.additionalBlackStones && currentTurn.additionalBlackStones.length > 0 )
				{
					for( var n in currentTurn.additionalBlackStones )
					{
						var tempStone = currentTurn.additionalBlackStones[n];
						this.removeStoneFromInternalBoard( tempStone );
						this.removeStoneFromDisplay( tempStone.x, tempStone.y, tempStone.color );
					}// End for n
				}// End if
				
				// If there is white territory in this node, decrease the white player's territory count
				if( currentTurn.territoryWhite && currentTurn.territoryWhite.length > 0 )
					this.playerWhite.territoryCount -= currentTurn.territoryWhite.length;
				
				// If there is black territory in this node, decrease the black player's territory count
				if( currentTurn.territoryBlack && currentTurn.territoryBlack.length > 0 )
					this.playerBlack.territoryCount -= currentTurn.territoryBlack.length;
				
				// Now that we've reversed the current turn, move back to the previous turn
				this.turnIndex--;
				
				// If the turn info panel was specified, display the previous move's info
				if( this.turnInfoPanel && this.turnIndex > -1 )
				{
					var previousTurn = this.turnObjects[ this.turnIndex ];
					var previousStone = previousTurn.stone;
					
					// Create a string with the details of the current play
					var turnInfoContent = 'Move ' + this.moveNumber + ': ';

					if( previousStone )
					{	
						if( previousStone.color == 'b' )
							turnInfoContent += 'Black ';
						else
							turnInfoContent += 'White ';
						
						if( previousStone.action == 'pass' )
							turnInfoContent += ' Pass';
						else
						{
							// Translate the stone's coordinates into alpha numeric
							var x = previousStone.x + 1;
							if( x >= 9 ) x++;
							x = String.fromCharCode( x + 64 );

							var y = previousStone.y + 1;
							y = y - 20;
							if( y < 0 ) y = y * -1;

							turnInfoContent += x + ' ' + y;
						}// End else
					}// End if
					else
						turnInfoContent += 'N/A';
					
					this.turnInfoPanel = $( options.turnInfo ).html( turnInfoContent );
					
					// If there is territory marked this turn, build the markup for it
					if( previousTurn.territoryBlack && previousTurn.territoryBlack.length > 0 )
					{
						for( var n in previousTurn.territoryBlack )
						{
							var point = previousTurn.territoryBlack[n];
							var cell = this.getBoardCellAt( point.x, point.y );
							
							var marker = document.createElement( 'div' );
							marker.className = 'marker territory_black';
							cell.appendChild( marker );
						}// End for n
					}// End if
					
					if( previousTurn.territoryWhite && currentTurn.previousWhite.length > 0 )
					{
						for( var n in previousTurn.territoryWhite )
						{
							var point = previousTurn.territoryWhite[n];
							var cell = this.getBoardCellAt( point.x, point.y );
							
							var marker = document.createElement( 'div' );
							marker.className = 'marker territory_white';
							cell.appendChild( marker );
						}// End for n	
					}// End if
					
					// If we have a comment, restore it
					if( previousTurn.comments && previousTurn.comments.length > 0 )
						this.addCommentToDisplay( previousTurn.comments );
					else
						this.addCommentToDisplay( ' ' );
				}// End if

				// If the index went out of range, put it back in range and return
				if( this.turnIndex < -1 )
					this.turnIndex = -1;

				return true;
*/
			},
			
			// Moves the turn index to the first node and updates the view
			firstTurn: function()
			{
/*				// If this object isn't fully loaded, return false
				if( ! this.loaded )
					return false;

				// While the turn index isn't at the first turn, call previousTurn.
				// Note: previousTurn deincrements the turnIndex
				while( this.previousTurn() );
*/
			},
			
			// Moves the turn index to the final node and updates the view
			lastTurn: function()
			{
/*				// If this object isn't fully loaded, return false
				if( ! this.loaded )
					return false;

				// While the turn index isn't at the last turn, call nextTurn.
				// Note: nextTurn increments turnIndex
				while( this.nextTurn() );
*/
			},
			
			// Updates the view so that it will shows the n'th move
			jumpToTurn: function( n )
			{
/*				// If this object isn't fully loaded, return false
				if( ! this.loaded )
					return false;

				// If n is in the range of moves
				if( parseInt( n ) != 'NaN' || n >= 0  || n <= this.turnObjects.length )
				{
					// Figure out whether we need to move forwards or backwards and do so.
					if( n < this.turnIndex )
					{
						while( n < this.turnIndex )
							this.previousTurn();
					}// End if
					else if( n > this.turnIndex )
					{
						while( n > this.turnIndex )
							this.nextTurn();
					}// End else
					
					return true;
				}// End if
				else
					return false;
*/
			},
			
			// Adds a stone to the board's display elements. Note: This function simple displays
			// the stone, it doesn't do any validation on the move
			addStoneToDisplay: function( x, y, color )
			{
/*				// Get a reference to the actual html element that will be used to display this stone
				var cell = this.getBoardCellAt( x, y );
				if( cell )
				{
					// Set the appropiate class name to display the stone image
					if( color == 'b' )
						cell.className = 'black';
					else
						cell.className = 'white';
				}// End if
*/
			},
			
			// Removes a stone from the board's display elements. Note: This function simply removes
			// the stone from the display.  Other than verifying the correct color, it does no other checks
			removeStoneFromDisplay: function( x, y, color )
			{
/*				// Get a reference to the actual html element that will be used to display this stone
				var cell = this.getBoardCellAt( x, y );
				if( cell )
				{
					cell.className = this.calculateLibertyClass( y + 1, x + 1 );
				}// End if
*/
			},
			
			// Adds a stone to the internal board which is used to run the logic for capturing stones
			addStoneToInternalBoard: function( stone )
			{
//				this.internalBoard[stone.y][stone.x] = stone;
			},
			
			// Removes a stone from the internal board, which is used to run the logic for capturing stones
			removeStoneFromInternalBoard: function( stone )
			{
//				this.internalBoard[stone.y][stone.x] = 'e';
			},

			// Adds a comment to the chat window
			addCommentToDisplay: function( comment )
			{
//				this.chatWindow.value = comment;
//				this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
			},
			
			// Removes a comment from the chat window
			removeCommentFromDisplay: function( comment )
			{
//				this.chatWindow.value = '';
			},
			
			// If the player info panel element is set, this function updates the number
			// of captures displayed for that player
			updateCaptureDisplay: function( color, numCaptures )
			{
/*				if( numCaptures == 0 )
					return;

				// Get the proper elements based on the color
				var captureDisplay = false;
				var playerObj = false;

				if( color == 'w' && this.playerWhitePanel )
				{
					captureDisplay = this.playerWhitePanel.find( '.white_captures' );
					playerObj = this.playerWhite;
				}// End if
				else if( color == 'b' && this.playerBlackPanel )
				{
					captureDisplay = this.playerBlackPanel.find( '.black_captures' );
					playerObj = this.playerBlack;
				}// End else
				
				// If we have the capture display element, update it
				if( captureDisplay )
				{
					var currentCaptureCount = parseInt( captureDisplay.html() );
					if( currentCaptureCount == NaN )
						currentCaptureCount = 0;
					
					currentCaptureCount += numCaptures;
					if( currentCaptureCount < 0 )
						currentCaptureCount = 0;
					
					captureDisplay.html( currentCaptureCount );
				}// End if
				
				// If we have a player object, update the number of captures
				if( playerObj )
				{
					playerObj.captures += numCaptures;
					if( playerObj.captures < 0 )
						playerObj.captures = 0;
				}// End if
*/
			},
			
			// Returns the table cell element stored in the board at x,y
			getBoardCellAt: function( x, y )
			{
/*				// Increment x and y so we will ignore the guide rows
				x++; y++;

				// Get a reference to the actual html td element
				var rows = this.boardElem.getElementsByTagName( 'tr' );
				if( rows.length > y )
				{
					var row = rows[y];
					var cells = row.getElementsByTagName( 'td' );
					if( cells.length > x )
					{
						// Set the className of the cell to an open liberty 
						return cells[x];
					}// End if
				}// End if

				return false;
*/
			},
			
			///////////////////////////////////////////////////////////////////////////
			//////////////////////////// Board Display methods ////////////////////////
			///////////////////////////////////////////////////////////////////////////
			
			// Returns the top and left coordinates for a given liberty
			calculateTileCoordinates: function( x, y )
			{
				var returnValue = { top: 0, left: 0 };
				
				// Get the offset of the DOM element that holds the board UI
				var gobanPosition = $( this.boardElem ).offset();
				
				returnValue.left = ( 20 * y ) + gobanPosition.left + 1;
				returnValue.top = ( 20 * x ) + gobanPosition.top + 1;
				
				return returnValue;
			},
		
			
			// A function that will return the proper innerHTML for the side coordinates
			calculateSideCoordinate: function( x, y )
			{
				// The return value
				var innerHTML = '&nbsp;';
				
				// The maximum for x and y with the board size
				var xMax = this.size + 1;
				var yMax = this.size + 1;
		
				// In building the side coordinates, we have to make sure not to set an innerHTML for the corner tiles.
				// The corner tiles are left blank so that the coordinates will line up with the liberty the coorespond to
		
				// If we are on the top row, and it's not a tile
				if( x == 0 && ( y != 0 && y != yMax ) )
				{
					// Theres no i in the coordinates
					if( y >= 9 )
						y++;
					innerHTML = String.fromCharCode( y + 64 );
				}// End if
				
				// If we are on the bottom row, and it's not a tile
				else if( x == xMax && ( y != 0 && y != yMax ) )
				{
					// Theres no i in the coordinates
					if( y >= 9 )
						y++;
					innerHTML = String.fromCharCode( y + 64 );
				}// End if
				
				// If we are on the left side, and it's not a tile
				else if( y == 0 && ( x != 0 && x != xMax ) )
					innerHTML = x;
				
				// If we are on the right side, and it's not a tile
				else if( y == yMax && ( x != 0 && x != xMax ) )
					innerHTML = x;
		
				return innerHTML;
			},
			
			// A function that will calculate the proper className to give to a liberty tile
			// based on the coordinates past in, and return it.
			calculateLibertyClass: function( x, y )
			{
				// The default liberty className
				var className = 'c';
		
				// If the tile is on the top row
				if( x == 1 )
				{
					// If we have the top left tile
					if( y == 1 )
						className = 'tl';
					// If we have the top right tile
					else if( y == this.size )
						className = 'tr';
					else
						className = 't';
				}// End if
				// If the tile is on the bottom row
				else if( x == this.size )
				{
					// If we have the bottom left tile
					if( y == 1 )
						className = 'bl';
					// If we have the bottom right tile
					else if( y == this.size )
						className = 'br';
					else
						className = 'b';
				}// End if
				// If we have a left side tile
				else if( y == 1 )
					className = 'l';
				// If we have a right side tile
				else if( y == this.size )
					className = 'r';
				else
				{
					// Otherwise, we have to check for a star point
		
					// Calculate the center of the board
					var center = Math.ceil( ( this.size ) / 2 );
					
					// The value for corner star points
					var cornerStar = ( this.size >= 13 )? 4: 3;
					
					// Top star points
					if( x == cornerStar )
					{
						if( y == cornerStar )
							className = 'cs';
						else if( y == ( this.size - ( cornerStar - 1 ) ) )
							className = 'cs';
						else if( y == center && this.size >= 17 )
							className = 'cs';
					}// End else if
					// Middle star points
					else if( x == center )
					{
						if( y == 4 && this.size >= 17 )
							className = 'cs';
						else if( y == ( this.size - 3 ) && this.size >= 17 )
							className = 'cs';
						else if( y == center )
							className = 'cs';
					}// End else if
					// Bottom star points
					else if( x == ( this.size - ( cornerStar - 1 ) ) )
					{
						if( y == cornerStar )
							className = 'cs';
						else if( y == ( this.size - ( cornerStar - 1 ) ) )
							className = 'cs';
						else if( y == center && this.size >= 17 )
							className = 'cs';
					}// End else if
				}// End else
				
				// Add the info that the board engine will use to display the turns
				// Note: This code should stay at the very end of this function because we are incrementing x and y
		
				// There are no I's in go coordinates
				if( x >= 9 )
					x++;
				
				if( y >= 9 )
					y++;
		
				// Using these class names, we can select a liberty by using it's x,y coordinates: $( '.liberty-x-y' )
				className += ' liberty liberty-' + String.fromCharCode( x + 97 ) + '-' + String.fromCharCode( y + 97 );
		
				// Return the calculated className
				return className;
			}
		} );// End goBoard object definition
		
		return goBoard;
	}// End function createBoard
} );

})(jQuery);
