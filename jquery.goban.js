(function($)
{
	$.fn.extend( { 
		goban: function( options ){
			return this.each( function()
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
					r_image: '/images/r-20x20.png'
				}, options );

				// Create a names reference to this element and prepare it for the goban
				var self = $( this ).empty().addClass( 'goban' );
				
				// Create the table that we will use to hold our board
				var goTable = document.createElement( 'table' );
				goTable.border = 0;
				goTable.cellPadding = 0;
				goTable.cellSpacing = 0;
				this.appendChild( goTable );
				
				// Create each liberty
				for( var x = 1; x <= options.size; ++x )
				{
					// Create the current row and append it to the table
					var row = document.createElement( 'tr' );
					goTable.appendChild( row );

					// Create each table cell
					for( var y = 1; y <= options.size; ++y )
					{
						var liberty = document.createElement( 'td' );
						row.appendChild( liberty );

						// Determine which liberty graphic to show
						var libertyImage = 'c';
						
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
						
						// Create the liberty image
						var libertyImageElem = document.createElement( 'img' );
						libertyImageElem.src = options.imageBase + options[ libertyImage + '_image' ];
						libertyImageElem.height = options.cellDim;
						libertyImageElem.width = options.cellDim;
						
						// Add the liberty to the table cell
						liberty.appendChild( libertyImageElem );
					}// End for y
				}// End for x
			} );
		}
	} );
} )( jQuery );