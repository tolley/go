// Author : Chris Tolley
// Date   : 09/09/2009
// Desc   : Contains the definition of a go board and the logic needed to 
//	    determine legal plays, ko, and removing captured stones.  After the boards
//	    have been returned from createGoBoard, they must either have the properties
//	    manually set or pass it to a parser object that will fill in the details

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
		
		// A go stone object.  Used to hold data for the update queue
		// action can be either "place" or "remove"
		function goStone( x, y, color, action, comments )
		{
			// Set the defaults
			this.x = false;
			this.y = false;
			this.color = false;
			this.action = 'place';
			this.comments = '';
			
			// If the user override any of the values, us it.
			if( x && x.length == 1 ) this.x = x;
			if( y && y.length == 1 ) this.y = y;
			if( color && color.length == 1 ) this.color = color;
			if( this.action && this.action.length > 0 ) this.action = action;
			if( this.comments && this.comments.length > 0 ) this.comments = comments;
		}// End goStone

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
				// Return true for now
				return true;
			},
			
			// Determines if a play at x/y by whatever color is there now captured
			// any stones.  If so, it removes the captured stones on the internal board.
			cleanUpPrisoners: function( x, y )
			{
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
				
				// Get shortcuts to the stone's coordinates
				var x = stone.x;
				var y = stone.y;
				
				// Keeps track of the removed stones list
				var removedList = new Array();

				// Switch based on the action of the stone
				switch( stone.action )
				{
					case 'place':
						// Place the stone on the board and see if any stones where captured
						if( x >= 0 && x < this.size && y >= 0 && y < this.size )
						{
							this.internalBoard[y][x] = stone.color;
							
							// Remove any captured stones and store the list
							// in the list of delta's
							this.turnDeltas[turn] = { stone: stone, removeList: {} }
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
				this.boardElem = document.createElement( 'table' );
				this.boardElem.border = 0;
				this.boardElem.cellPadding = 0;
				this.boardElem.cellSpacing = 0;
				elem.appendChild( this.boardElem );
				
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

						// Switch based on the value in the internal board
						switch( this.internalBoard[ x - 1 ][ y - 1 ] )
						{
							// The current x/y'th liberty is empty
							case 'e':
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
								break;
							
							// The x/y'th liberty has a black stone on it
							case 'b':
								var libertyImage = 'black';
								var libertyText = 'B';
								break;
							
							// The x/y'th liberty has a white stone on it
							case 'w':
								var libertyImage = 'white';
								var libertyText = 'W';
								break;
						}// End switch
						
						// Create the liberty image
//						var libertyImageElem = document.createElement( 'img' );
//						libertyImageElem.src = options.imageBase + options[ libertyImage + '_image' ];
//						libertyImageElem.height = options.cellDim;
//						libertyImageElem.width = options.cellDim;

						// Add the liberty to the table cell
//						liberty.appendChild( libertyImageElem );

						var libertyElem = document.createElement( 'span' );
						libertyElem.innerHTML = libertyText;
						liberty.vAlign = 'center';
						liberty.appendChild( libertyElem );
					}// End for y
				}// End for x
				
				// Create the chat window
				this.chatWindow = document.createElement( 'textarea' );
				this.chatWindow.id = 'gogameChat';
				this.chatWindow.style.width = '100%';

				// Add the chat window to the board html element
				var row = document.createElement( 'tr' );
				var col = document.createElement( 'td' );
				col.colSpan = options.size;
				col.appendChild( this.chatWindow );
				row.appendChild( col );
				this.boardElem.appendChild( row );
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
				if( this.deltaIndex < 1 )
					this.deltaIndex = 1;
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
						var display = cell.getElementsByTagName( 'span' )[0];
						display.innerHTML = color.toUpperCase();
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
						var display = cell.getElementsByTagName( 'span' )[0];
						display.innerHTML = '.';
					}// End if
				}// End if
			},
			
			// Adds a comment to the chat window
			addCommentToDisplay: function( comment )
			{
				if( ! comment || comment.length == 0 )
					return;
				
				this.chatWindow.value += comment + "\n";
			},
			
			// Removes a comment from the chat window
			removeCommentFromDisplay: function( comment )
			{
				if( ! comment || comment.length == 0 )
					return;
				
				this.chatWindow.value = this.chatWindow.value.replace( comment, '' );
				this.chatWindow.value = $.trim( this.chatWindow.value );
			}
		} );// End goBoard object definition
		
		return goBoard;
	}// End function createBoard
} );

})(jQuery);
