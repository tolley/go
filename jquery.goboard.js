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

		// The go board object definition
		var goBoard = new Object( {
			// The internal representation of the state of the board
			internalBoard: false,
			
			// A reference to the chat window
			chatWindow: false,
			
			// A reference to the html elements that make up the board display
			boardElem: false,
			
			// Sets the size of the board
			setBoardSize: function( size )
			{
				// If the board has already been sized, then don't do it again
				if( this.internalBoard )
					return;					

				if( size > 0 )
				{
					options.size = size;
					
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
			
			// Places a black stone on the board. Coordinates are letter pairs
			playWhiteStone: function( coords )
			{
				if( ! coords || coords.length != 2 )
					return;

				// Break up the coordinates and translate them from a letter to a number
				var x = parseInt( coords.charCodeAt( 0 ) ) - 97;
				var y = parseInt( coords.charCodeAt( 1 ) ) - 97;
				
				// If this is a valid play 
				if( this.isValidPlay( 'b', x, y ) )
				{
					// Correct spot in the games internal memory
					this.internalBoard[y][x] = 'w';
					
					// Remove any captured stones
					this.cleanUpPrisoners( x, y );
				}// End if
			},
			
			// Places a white stone on the board. Coordinates are letter pairs
			playBlackStone: function( coords )
			{
				if( ! coords || coords.length != 2 )
					return;

				// Break up the coordinates and translate them from a letter to a number
				var x = parseInt( coords.charCodeAt( 0 ) ) - 97;
				var y = parseInt( coords.charCodeAt( 1 ) ) - 97;
				
				// If this is a valid play 
				if( this.isValidPlay( 'b', x, y ) )
				{
					// Correct spot in the games internal memory
					this.internalBoard[y][x] = 'b';
					
					// Remove any captured stones
					this.cleanUpPrisoners( x, y );
				}// End if
			}, 

			// Adds a comment to the board
			addComment: function( msg )
			{
				this.chatWindow.value += msg + "\n";
			},

			// Returns true if x/y is a valid play for color(w,b)
			isValidPlay: function( color, x, y )
			{
				// Return true for now
				return true;
			},
			
			// Determines if a play at x/y by whatever color is there now captured
			// any stones.  If so, it removes the captured stones on the internal board.
			cleanUpPrisoners: function( x, y )
			{
			},

			// A dummy function to draw the board
			render: function()
			{
				// If the internal board isn't set, let the user know
				if( ! this.internalBoard )
				{
					alert( 'Board has not been set, unable to render' );
					return;
				}// End if

				// Create a names reference to this element and prepare it for the goban
				var self = $( elem ).empty().addClass( 'goban' );
				
				// Create the table that we will use to hold our board
				this.boardElem = document.createElement( 'table' );
				this.boardElem.border = 0;
				this.boardElem.cellPadding = 0;
				this.boardElem.cellSpacing = 0;
				elem.appendChild( this.boardElem );
				
				// Create each liberty
				for( var x = 1; x <= options.size; ++x )
				{
					// Create the current row and append it to the table
					var row = document.createElement( 'tr' );
					this.boardElem.appendChild( row );

					// Create each table cell
					for( var y = 1; y <= options.size; ++y )
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
									else if( y == options.size )
										libertyImage = 'tr';
									else
										libertyImage = 't';
								}// End if
								else if( x == options.size )
								{
									if( y == 1 )
										libertyImage = 'bl';
									else if( y == options.size )
										libertyImage = 'br';
									else
										libertyImage = 'b';				
								}// End else if
								else if( y == 1 )
								{
									libertyImage = 'l';
								}// End else if
								else if( y == options.size )
								{
									libertyImage = 'r';
								}// End else if
								else
								{
									// Here we check for star points
									// Calculate the center of the board
									var center = Math.ceil( ( options.size ) / 2 );
									
									if( x == 4 )
									{
										if( y == 4 )
											libertyImage = 'cs';
										else if( y == ( options.size - 3 ) )
											libertyImage = 'cs';
										else if( y == center && options.size >= 17 )
											libertyImage = 'cs';
									}// End else if
									else if( x == center )
									{
										if( y == 4 && options.size >= 17 )
											libertyImage = 'cs';
										else if( y == ( options.size - 3 ) && options.size >= 17 )
											libertyImage = 'cs';
										else if( y == center )
											libertyImage = 'cs';
									}// End else if
									else if( x == ( options.size - 3 ) )
									{
										if( y == 4 )
											libertyImage = 'cs';
										else if( y == ( options.size - 3 ) )
											libertyImage = 'cs';
										else if( y == center && options.size >= 17 )
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
			}
		} );
		
		return goBoard;
	}// End function createBoard
} );

})(jQuery);
