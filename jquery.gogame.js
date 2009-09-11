(function($)
{
	$.fn.extend( { 
		gogame: function( options ){
			return this.each( function()
			{
				// Create a board object
				this.board = $.createGoBoard( options, this );
				
				// Create a placeholder for the game parser object
				this.gameFile = false;
				
				// A flag used to signal that loading is done.
				this.gameLoaded = false;
				
				var self = this;
				
				// If there is a file in the options, create the appropiate parser
				// and load the file into javascript variables
				if( options.url && options.url.length > 0 )
				{
					// Switch based on the file type
					switch( options.format )
					{
						case 'sgf':
							this.gameFile = $.loadSGF( options.url, function( gameTree )
							{
								// Save a reference to the game file, let the world know a 
								// game as been loaded, and pass the board to the parser
								self.gameFile = gameTree;
								self.gameLoaded = true;
								self.gameFile.setBoard( self.board );
							} );
							break;
						default:
							alert( 'Unrecognized file type "' + options.format + '"' );
					}// End switch file format
				}// End if
				
				// Advances the loaded game to the next move
				this.next = function()
				{
					console.log( 'here we are in next' );
					if( self.gameFile )
						self.gameFile.next();
				}// End this.next
				
				// Backs the loaded game up to the previous move
				this.previous = function()
				{
					if( self.gameFile )
						self.gameFile.previous();
				}// End this.previous
			} );
		}
	} );
} )( jQuery );