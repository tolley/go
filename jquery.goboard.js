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
			imageBase: '',
			cellDim: 20,
			c_image: '/images/c-20x20.png',
			cs_image: '/images/cs-20x20.png',
			tl_image: '/images/tl-20x20.png',
			tr_image: '/images/tr-20x20.png',
			bl_image: '/images/bl-20x20.png',
			br_image: '/images/br-20x20.png',
			t_image: '/images/t-20x20.png',
			b_image: '/images/b-20x20.png',
			l_image: '/images/l-20x20.png',
			r_image: '/images/r-20x20.png',
			white_image: '/images/white-20x20.png',
			black_image: '/images/black-20x20.png'
		}, options );

		// The go board object definition
		var goBoard = new Object( {
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
				
				var console = document.getElementById( 'console' );
				
				// Create each liberty
				for( var x = 1; x <= this.size; ++x )
				{
					// Create the current row and append it to the table
					var row = document.createElement( 'tr' );
					this.boardElem.appendChild( row );

					// Create each table cell
					for( var y = 1; y <= this.size; ++y )
					{
						var liberty = document.createElement( 'td' );
						row.appendChild( liberty );

						// If the liberty has a stone on it
						if( typeof this.internalBoard[ x - 1 ][ y - 1 ] == 'object' )
						{
							if( this.internalBoard[ x - 1 ][ y - 1 ].color == 'b' )
								var libertyImage = 'black_image';
							else
								var libertyImage = 'white_image';
						}// End if
						else if( this.internalBoard[ x - 1 ][ y - 1 ] == 'e' )
						{
							// Otherwise, the liberty is open and we need to figure out 
							// which image to use.
							var libertyImage = this.calculateLibertyImage( x, y );
						}// End else if
						
						// Create the liberty image
						var libertyImageElem = document.createElement( 'img' );
						libertyImageElem.src = options.imageBase + options[ libertyImage ];						
						libertyImageElem.height = options.cellDim;
						libertyImageElem.width = options.cellDim;

						// Add the liberty to the table cell
						liberty.appendChild( libertyImageElem );
					}// End for y
				}// End for x

				// Set the reference to the chat window, if one is set
				if( options.chatWindow && options.chatWindow.length > 0 )
				{
					var temp = $( options.chatWindow );
					if( temp.length > 0 )
						this.chatWindow = temp[0];
				}// End if
			},
			
			// Moves the delta index forward one and applies the changes to the board display
			nextTurn: function()
			{
				this.deltaIndex++;

				// If the index went out of range, put it back in range and return
				if( this.deltaIndex >= this.turnDeltas.length )
				{
					this.deltaIndex = this.turnDeltas.length - 1;
					return;
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
						
						// If we have a comment, add it to the board
						if( currentStone.comments && currentStone.comments.length > 0 )
							this.addCommentToDisplay( currentStone.comments );
						break;
					case 'pass':
						// Do nothing for a pass
						break;
					default:
						alert( 'Error: Unrecognized action in turn delta: ' + currentStone.action );
						break;
				}// End switch action
			},
			
			// Moves the delta index back one and applies the changes to the board display
			previousTurn: function()
			{
				// If we are already on the first move, return
				if( this.deltaIndex == 0 )
					return;
	
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
			},
			
			// Adds a stone to the board's display elements. Note: This function simply displays
			// the stone, it doesn't do any validation on the move
			addStoneToDisplay: function( x, y, color )
			{
				// Get a reference to the actual html element that will be used to display this stone
				var rows = this.boardElem.getElementsByTagName( 'tr' );
				if( rows.length > y )
				{
					var row = rows[y];
					var cells = row.getElementsByTagName( 'td' );
					if( cells.length > x )
					{
						var cell = cells[x];
						
						// Set the inner html of the display to the approiate color
						var display = cell.getElementsByTagName( 'img' )[0];
						if( color == 'b' )
							display.src = options.black_image;
						else
							display.src = options.white_image;
					}// End if
				}// End if
			},
			
			// Removes a stone from the board's display elements. Note: This function simply removes
			// the stone from the display.  Other than verifying the correct color, it does no other checks
			removeStoneFromDisplay: function( x, y, color )
			{
				// Get a reference to the actual html element that will be used to display this stone
				var rows = this.boardElem.getElementsByTagName( 'tr' );
				if( rows.length > y )
				{
					var row = rows[y];
					var cells = row.getElementsByTagName( 'td' );
					if( cells.length > x )
					{
						var cell = cells[x];
						
						// Set the inner html of the display to the approiate color
						var display = cell.getElementsByTagName( 'img' )[0];
						display.src = options.imageBase + options[ this.calculateLibertyImage( y + 1, x + 1 ) ];
					}// End if
				}// End if
			},
			
			// Adds a comment to the chat window
			addCommentToDisplay: function( comment )
			{
				// If the comment isn't set, or if the user didn't supply a chat window
				if( ! comment || comment.length == 0 || ! this.chatWindow )
					return;
				
				this.chatWindow.value += comment + "\n";
			},
			
			// Removes a comment from the chat window
			removeCommentFromDisplay: function( comment )
			{
				// If the comment isn't set, or if the user didn't supply a chat window
				if( ! comment || comment.length == 0 || ! this.chatWindow )
					return;
				
				this.chatWindow.value = this.chatWindow.value.replace( comment, '' );
				this.chatWindow.value = $.trim( this.chatWindow.value );
			},
			
			// Returns the value of the image file to use as the liberty image for an empty liberty
			// Note: It uses the board's size, and the image paths passed in from the options
			calculateLibertyImage: function( x, y )
			{
				// Determine which liberty graphic to show
				var libertyImage = 'c';
				var libertyText = '.';
				
				// The series of if else if statements basically handle the edges of the board.
				// If the final else condition is executed it will check for star points.  The
				// default return value is a center open liberty
				if( x == 1 )
				{
					if( y == 1 )
						libertyImage = 'tl';
					else if( y == this.size )
						libertyImage = 'tr';
					else
						libertyImage = 't';
				}// End if
				else if( x == this.size )
				{
					if( y == 1 )
						libertyImage = 'bl';
					else if( y == this.size )
						libertyImage = 'br';
					else
						libertyImage = 'b';				
				}// End else if
				else if( y == 1 )
				{
					libertyImage = 'l';
				}// End else if
				else if( y == this.size )
				{
					libertyImage = 'r';
				}// End else if
				else
				{
					// Here we check for star points
					// Calculate the center of the board
					var center = Math.ceil( ( this.size ) / 2 );
					
					if( x == 4 )
					{
						if( y == 4 )
							libertyImage = 'cs';
						else if( y == ( this.size - 3 ) )
							libertyImage = 'cs';
						else if( y == center && this.size >= 17 )
							libertyImage = 'cs';
					}// End else if
					else if( x == center )
					{
						if( y == 4 && this.size >= 17 )
							libertyImage = 'cs';
						else if( y == ( this.size - 3 ) && this.size >= 17 )
							libertyImage = 'cs';
						else if( y == center )
							libertyImage = 'cs';
					}// End else if
					else if( x == ( this.size - 3 ) )
					{
						if( y == 4 )
							libertyImage = 'cs';
						else if( y == ( this.size - 3 ) )
							libertyImage = 'cs';
						else if( y == center && this.size >= 17 )
							libertyImage = 'cs';
					}// End else if
				}// End else

				return libertyImage + '_image';
			}
		} );// End goBoard object definition
		
		return goBoard;
	}// End function createBoard
} );

})(jQuery);
