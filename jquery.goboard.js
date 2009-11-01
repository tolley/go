// Author : Chris Tolley
// Date   : 09/09/2009
// Desc   : Contains the definition of a go board and the logic needed to 
//	    remove captured stones.  The board is created by the main jquery plugin.
//	    That plugin will also create the appropiate parser object, which will then
//	    set any static game properties, and call board.calculateTurnDelta, for each turn, in order.
//	    Once the turn delta's have been set up, the parser must call board.onDeltasFinished 
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
			deltaIndex: 0,

			// A reference to the chat window
			chatWindow: false,
			
			// A reference to the html elements that make up the board display
			boardElem: false,
			
			// An array to hold the delta's between turns
			turnDeltas: new Array(),
			
			// Stores the handicap stone coordinates
			handicapStones: new Array(),
			
			// Stores any copyright related information found in the game file
			copyrightInfo: '',
			
			// The date/time that this game was played
			dateTime: '',
			
			// The event/venue where this game was played
			event: '',
			
			// The name of the game
			gameName: '',
			
			// The final result of the game
			result: '',
			
			// The round number and type (final, semifinal) of this game
			roundInfo: '',
			
			// The rules set this game was played under
			rulesSet: '',
			
			// The source of this game (book, journal)
			source: '',
			
			// Extra information about this game
			gameInfo: '',
			
			// The location/server where this game was played
			location: '',
			
			// The time limit for this game
			timeLimit: '',
			
			// The person or server that created this game file
			author: '',
			
			// The object that holds the black player's information
			playerBlack: false,
			
			// The object that holds the white player's information
			playerWhite: false,
			
			// A flag set to true when we are to mark the most recently played stone
			markCurrentStone: true,			

			// Sets the size of the board
			setBoardSize: function( size )
			{
				// If the board has already been sized, then don't do it again
				if( this.internalBoard && this.size )
					return;			

				if( size > 0 )
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
			
			// Lets the parser set the position of all handicap stones on the board
			setHandicapStones: function( stones )
			{
				if( stones && stones.length > 0 )
				{
					this.handicapStones = stones;

					for( var n = 0; n < this.handicapStones.length; ++n )
					{
						var stone = this.handicapStones[n];
						this.internalBoard[stone.y][stone.x] = stone;
					}// End for n
				}// End if
			},
			
			// Called by the parser to get blank stone objects.  These are the stones
			// that will be passed back to the board, with values, to calculate turn deltas
			getBlankStone: function()
			{
				return { x: 	  false, 
					 y: 	  false, 
					 color:    false, 
					 comments: '',
					 action:   false, 
					 number:   false };
			},
   
   			// Creates an empty player object.  These objects are used by the parser to set the 
   			// player properties.
   			getBlankPlayerObj: function( color )
			{
				return { 
					color: color,
					name: 'N/A',
					rank: 'N/A',
					teamName: 'N/A'
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
			
			// Called by the parser object, in order of moves, to set the turn deltas.
			// Note: This function uses the internal board to determine if we have a legal play
			// or if stones where captured.  If you don't call this function in turn order, it won't work
			calculateTurnDelta: function( turn, stone )
			{				
				// If the turn delta's have already been set for the given turn,
				// let the user know
				if( this.turnDeltas[turn] )
				{
					alert( 'Turn Deltas already set for turn ' + turn );
					return;
				}// End if
				
				// Keeps track of the removed stones list
				var removedList = new Array();

				// Switch based on the action of the stone
				switch( stone.action )
				{
					case 'place':
						// Place the stone on the board and see if any stones where captured
						if( this.isLegalPlay( stone ) )
						{
							this.internalBoard[stone.y][stone.x] = stone;
							
							// Remove any captured stones and store the list
							// in the list of delta's
							var removeList = this.removeStonesCapturedBy( stone.x, stone.y );

							this.turnDeltas[turn] = { stone: stone, removeList: removeList }
						}// End if
						break;
					case 'pass':
						// If the user is passing, do nothing.
						break;
					default:
						alert( "Unrecognized action " + stone.action );
						break;
				}// End switch
			},
			
			// Called during the generation of the turn deltas.  It takes in the coordinates of stone
			// after it was just played.  This function returns a list of all captured stones and removes
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
			
			// Called during the generation of the turn deltas.  Returns a list of all stones connected 
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

			// To be called after the turn delta's have been calculated.  It generates the html elements
			// used to display the board.
			onDeltasFinished: function()
			{
				// Make sure we actually have some delta's
				if( this.turnDeltas.length == 0 )
				{
					alert( 'Unable to render game, turn delta have not been calculated' );
					return;
				}// End if
				
				// Reset the board's internal representation
				if( this.size > 0 )
				{
					// Update the internal board
					this.internalBoard = new Array();
					for( var y = 0; y < this.size; ++y )
					{
						for( var x = 0; x < this.size; ++x )
						{
							if( ! ( this.internalBoard[x] instanceof Array ) )
								this.internalBoard[x] = new Array();
							this.internalBoard[x].push( 'e' );
						}// End for y
					}// End for x
				}// End if
				else
				{
					alert( 'Unable to render board in onDeltasFinished: board size not set' );
					return;
				}// End else
				
				// Make sure we are on the first set of turn delta's
				this.deltaIndex = 0;

				// Add any handicapped stones to the internal memory
				if( this.handicapStones.length > 0 )
				{
					for( var n = 0; n < this.handicapStones.length; ++n )
					{
						var stone = this.handicapStones[n];
						this.internalBoard[stone.y][stone.x] = stone;
					}// End for n
				}// End if

				// Draw the board using the internal representation
				// Create a names reference to this element and prepare it for the goban
				var self = $( elem ).empty().addClass( 'goban' );
				
				// Create the table that we will use to hold our board
				var table = document.createElement( 'table' );
				table.border = 0;
				table.cellPadding = 0;
				table.cellSpacing = 0;
				this.boardElem = document.createElement( 'tbody' );
				table.appendChild( this.boardElem );

				elem.appendChild( table );
				
				// Create the first row, which is alpha character
				var row = document.createElement( 'tr' );
				this.boardElem.appendChild( row );
				
				// Create a blank cell so that the table will line up correctly
				var blankLabel = document.createElement( 'td' );
				blankLabel.className = 'blank';
				row.appendChild( blankLabel );
				
				// Create the cells labeled A through x that appear at the top of the board
				for( var x = 1; x <= this.size; ++x )
				{
					var labelCell = document.createElement( 'td' );
					labelCell.className = 'blank';
					
					var label = document.createElement( 'span' );
					label.className = 'blank';
					label.innerHTML = String.fromCharCode( x + 64 );
					labelCell.appendChild( label );
					row.appendChild( labelCell );
				}// End for x
				
				// Create a blank cell so that the table will line up correctly
				var blankLabel = document.createElement( 'td' );
				blankLabel.className = 'blank';
				row.appendChild( blankLabel );
				
				// Create each liberty
				for( var x = 1; x <= this.size; ++x )
				{
					// Create the current row and append it to the table
					var row = document.createElement( 'tr' );
					this.boardElem.appendChild( row );
					
					// Create the number that resides besides the board on the left
					var labelCell = document.createElement( 'td' );
					labelCell.className = 'blank';
					
					var label = document.createElement( 'span' );
					label.className = 'blank';
					label.innerHTML = Math.abs( ( this.size - x ) * -1 ) + 1;
					labelCell.appendChild( label );
					row.appendChild( labelCell );

					// Create each table cell (liberty)
					for( var y = 1; y <= this.size; ++y )
					{
						var liberty = document.createElement( 'td' );
						row.appendChild( liberty );

						// If the liberty has a stone on it
						if( typeof this.internalBoard[ x - 1 ][ y - 1 ] == 'object' )
						{
							if( this.internalBoard[ x - 1 ][ y - 1 ].color == 'b' )
								var libertyClass = 'black';
							else
								var libertyClass = 'white';
						}// End if
						else if( this.internalBoard[ x - 1 ][ y - 1 ] == 'e' )
						{
							// Otherwise, the liberty is open and we need to figure out 
							// which image to use.
							var libertyClass = this.calculateLibertyClass( x, y );
						}// End else if

						liberty.className = libertyClass;
					}// End for y

					// Create the number that resides besides the board on the right
					var labelCell = document.createElement( 'td' );
					labelCell.className = 'blank';
					
					var label = document.createElement( 'span' );
					label.className = 'blank';
					label.innerHTML = Math.abs( ( this.size - x ) * -1 ) + 1;
					labelCell.appendChild( label );
					row.appendChild( labelCell );
				}// End for x
				
				// Create the last row, which is alpha character
				var row = document.createElement( 'tr' );
				this.boardElem.appendChild( row );
				
				// Create a blank cell so that the table will line up correctly
				var blankLabel = document.createElement( 'td' );
				blankLabel.className = 'blank';
				row.appendChild( blankLabel );
				
				// Create the cells labeled A through x that appear at the top of the board
				for( var x = 1; x <= this.size; ++x )
				{
					var labelCell = document.createElement( 'td' );
					labelCell.className = 'blank';
					
					var label = document.createElement( 'span' );
					label.className = 'blank';
					label.innerHTML = String.fromCharCode( x + 64 );
					labelCell.appendChild( label );
					row.appendChild( labelCell );
				}// End for x
				
				// Create a blank cell so that the table will line up correctly
				var blankLabel = document.createElement( 'td' );
				blankLabel.className = 'blank';
				row.appendChild( blankLabel );

				// Set the reference to the chat window, if one is set
				if( options.chatWindow && options.chatWindow.length > 0 )
				{
					var temp = $( options.chatWindow );
					if( temp.length > 0 )
						this.chatWindow = temp[0];
				}// End if
				
				// Tell the world we have loaded
				this.loaded = true;
			},
			
			// Moves the delta index forward one and applies the changes to the board display
			nextTurn: function()
			{
				// If this object isn't fully loaded, return false
				if( ! this.loaded )
					return false;

				this.deltaIndex++;

				// If the index went out of range, put it back in range and return
				if( this.deltaIndex >= this.turnDeltas.length )
				{
					this.deltaIndex = this.turnDeltas.length - 1;
					return false;
				}// End if
				
				// Apply the deltas for the current turn
				var currentDeltas = this.turnDeltas[ this.deltaIndex ];
				var currentStone = currentDeltas.stone;
				
				// Switch based on the stones action
				switch( currentStone.action )
				{
					case 'place':
						// Add the stone to the board
						this.addStoneToDisplay( currentStone.x,
									currentStone.y,
									currentStone.color );
						
						// Foreach stone in the remove list, remove it from the board
						for( var number in currentDeltas.removeList )
						{
							var tempStone = currentDeltas.removeList[number];
							this.removeStoneFromDisplay( tempStone.x, tempStone.y, tempStone.color );
						}// End for each removed stone
						
						// If we are to mark the most recently played stone
						if( this.markCurrentStone )
						{
							// Find and remove any current stone markers
							$( '#current_play' ).each( function()
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
						
						// If we have a comment, add it to the board
						if( currentStone.comments && currentStone.comments.length > 0 )
							this.addCommentToDisplay( currentStone.comments );
						break;
					case 'pass':
						// Do nothing for a pass
						break;
					default:
						alert( 'Error: Unrecognized action in turn delta: ' + currentStone.action );
						return false;
						break;
				}// End switch action
				
				return true;
			},
			
			// Moves the delta index back one and applies the changes to the board display
			previousTurn: function()
			{
				// If this object isn't fully loaded, return false
				if( ! this.loaded )
					return false;

				// If we are already on the first move, return
				if( this.deltaIndex == 0 )
					return false;
	
				// Apply the changes for the current delta
				var currentDeltas = this.turnDeltas[ this.deltaIndex ];
				var currentStone = currentDeltas.stone;
				
				// Switch based on the stones action
				switch( currentStone.action )
				{
					case 'place':
						// Remove the stone from the board
						this.removeStoneFromDisplay( currentStone.x,
									     currentStone.y,
									     currentStone.color );
						
						// Foreach stone in the remove list, put it back on the board
						for( var number in currentDeltas.removeList )
						{
							var tempStone = currentDeltas.removeList[number];
							this.addStoneToDisplay( tempStone.x, tempStone.y, tempStone.color );
						}// End for each removed stone
						
						// If we are to mark the most recently played stone
						if( this.markCurrentStone )
						{
							// Find and remove any current stone markers
							$( '#current_play' ).each( function()
							{
								this.parentNode.removeChild( this );
							} );

							// Get the previously played stone, if there is one
							if( this.deltaIndex > 1 )
							{
								var previousStone = this.turnDeltas[ this.deltaIndex - 1 ].stone;

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
						
						// If we have a comment, remove it from the board
						if( currentStone.comments && currentStone.comments.length > 0 )
							this.removeCommentFromDisplay( currentStone.comments );
						break;
					case 'pass':
						// Do nothing for a pass
						break;
					default:
						alert( 'Error: Unrecognized action in turn delta: ' + currentStone.action );
						break;
				}// End switch action
				
				// Now that we've reversed the current turn, move back to the previous turn
				this.deltaIndex--;

				// If the index went out of range, put it back in range and return
				if( this.deltaIndex < 0 )
					this.deltaIndex = 0;

				return true;
			},
			
			// Moves the delta index to the first node and updates the view
			firstTurn: function()
			{
				// If this object isn't fully loaded, return false
				if( ! this.loaded )
					return false;

				// While the delta index isn't at the first turn, call previousTurn.
				// Note: previousTurn deincrements the deltaIndex
				while( this.previousTurn() );
			},
			
			// Moves the delta index to the final node and updates the view
			lastTurn: function()
			{
				// If this object isn't fully loaded, return false
				if( ! this.loaded )
					return false;

				// While the delta index isn't at the last turn, call nextTurn.
				// Note: nextTurn increments deltaIndex
				while( this.nextTurn() );
			},
			
			// Updates the view so that it will shows the n'th move
			jumpToTurn: function( n )
			{
				// If this object isn't fully loaded, return false
				if( ! this.loaded )
					return false;

				// If n is in the range of moves
				if( parseInt( n ) != 'NaN' || n >= 0  || n <= this.turnDeltas.length )
				{
					// Figure out whether we need to move forwards or backwards and do so.
					if( n < this.deltaIndex )
					{
						while( n < this.deltaIndex )
							this.previousTurn();
					}// End if
					else if( n > this.deltaIndex )
					{
						while( n > this.deltaIndex )
							this.nextTurn();
					}// End else
					
					return true;
				}// End if
				else
					return false;
			},
			
			// Adds a stone to the board's display elements. Note: This function simply displays
			// the stone, it doesn't do any validation on the move
			addStoneToDisplay: function( x, y, color )
			{
				// Get a reference to the actual html element that will be used to display this stone
				var cell = this.getBoardCellAt( x, y );
				if( cell )
				{
					// Set the appropiate class name to display the stone image
					if( color == 'b' )
						cell.className = 'black';
					else
						cell.className = 'white';
				}// End if
			},
			
			// Removes a stone from the board's display elements. Note: This function simply removes
			// the stone from the display.  Other than verifying the correct color, it does no other checks
			removeStoneFromDisplay: function( x, y, color )
			{
				// Get a reference to the actual html element that will be used to display this stone
				var cell = this.getBoardCellAt( x, y );
				if( cell )
				{
					cell.className = this.calculateLibertyClass( y + 1, x + 1 );
				}// End if
			},
			
			// Adds a comment to the chat window
			addCommentToDisplay: function( comment )
			{
				// If the comment isn't set, or if the user didn't supply a chat window
				if( ! comment || comment.length == 0 || ! this.chatWindow )
					return;
				
				this.chatWindow.value += comment + "\n";
				this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
			},
			
			// Removes a comment from the chat window
			removeCommentFromDisplay: function( comment )
			{
				// If the comment isn't set, or if the user didn't supply a chat window
				if( ! comment || comment.length == 0 || ! this.chatWindow )
					return;
				
				this.chatWindow.value = this.chatWindow.value.replace( comment, '' );
				this.chatWindow.value = $.trim( this.chatWindow.value ) + "\n";
				var self = this;
				setTimeout( function(){ self.chatWindow.scrollTop = self.chatWindow.scrollHeight }, 1 );
			},
			
			// Returns the table cell element stored in the board at x,y
			getBoardCellAt: function( x, y )
			{
				// Increment x and y so we will ignore the guide rows
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
			},
			
			// Returns the value of the image file to use as the liberty image for an empty liberty
			// Note: It uses the board's size, and the image paths passed in from the options
			calculateLibertyClass: function( x, y )
			{
				// Determine which liberty graphic to show
				var libertyClass = 'c';
				var libertyText = '.';
				
				// The series of if else if statements basically handle the edges of the board.
				// If the final else condition is executed it will check for star points.  The
				// default return value is a center open liberty
				if( x == 1 )
				{
					if( y == 1 )
						libertyClass = 'tl';
					else if( y == this.size )
						libertyClass = 'tr';
					else
						libertyClass = 't';
				}// End if
				else if( x == this.size )
				{
					if( y == 1 )
						libertyClass = 'bl';
					else if( y == this.size )
						libertyClass = 'br';
					else
						libertyClass = 'b';				
				}// End else if
				else if( y == 1 )
				{
					libertyClass = 'l';
				}// End else if
				else if( y == this.size )
				{
					libertyClass = 'r';
				}// End else if
				else
				{
					// Here we check for star points
					// Calculate the center of the board
					var center = Math.ceil( ( this.size ) / 2 );
					
					if( x == 4 )
					{
						if( y == 4 )
							libertyClass = 'cs';
						else if( y == ( this.size - 3 ) )
							libertyClass = 'cs';
						else if( y == center && this.size >= 17 )
							libertyClass = 'cs';
					}// End else if
					else if( x == center )
					{
						if( y == 4 && this.size >= 17 )
							libertyClass = 'cs';
						else if( y == ( this.size - 3 ) && this.size >= 17 )
							libertyClass = 'cs';
						else if( y == center )
							libertyClass = 'cs';
					}// End else if
					else if( x == ( this.size - 3 ) )
					{
						if( y == 4 )
							libertyClass = 'cs';
						else if( y == ( this.size - 3 ) )
							libertyClass = 'cs';
						else if( y == center && this.size >= 17 )
							libertyClass = 'cs';
					}// End else if
				}// End else

				return libertyClass;
			}
		} );// End goBoard object definition
		
		return goBoard;
	}// End function createBoard
} );

})(jQuery);
