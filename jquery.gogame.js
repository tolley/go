// Author : Chris Tolley
// Date   : 09/09/2009
// Desc   : A jquery plugin that will allow users to simply and flexible 
// 	    display saved go game files on a website, provided the file
//	    is available on their domain.
//
// Ex: var goban = $( '#goban' ).gogame( { 'chatWindow': '#chatWindow', 
//					    'url': url, 
//					    'format': 'sgf' } );

(function($)
{
	$.fn.gogame = function( options )
	{
		// The display elements and ko/capture logic
		var goBoard = false;
		this.each( function()
		{
			// This only allows a single board on a given page.
			goBoard = $.createGoBoard( options, this );
		} );
		
		// The game file
		var gameFile = false;
		
		// A flag used to signal the loading is done
		var gameLoaded = false;
		
		// If there is a file in the options, create the appropiate parser
		// and load the file into javascript variables
		if( options.url && options.url.length > 0 )
		{
			// Switch based on the file type
			switch( options.format )
			{
				case 'sgf':
					gameFile = $.loadSGF( options.url, function( gameTree )
					{
						// Save a reference to the game file, let the world know a 
						// game as been loaded, and pass the board to the parser
						gameFile = gameTree;
						gameLoaded = true;
						gameFile.prepBoard( goBoard );
					} );
					break;
				default:
					alert( 'Unrecognized file type "' + options.format + '"' );
			}// End switch file format
		}// End if
		
		// Advances the loaded game to the next move
		$.fn.goGameNext = function()
		{
			if( goBoard )
				goBoard.nextTurn();
		}// End this.next
		
		// Backs the loaded game up to the previous move
		$.fn.goGamePrevious = function()
		{
			if( goBoard )
				goBoard.previousTurn();
		}// End this.previous
		
		// If the next and previous button's are specified, plug into their click events
		if( options.nextBtn && options.nextBtn.length > 0 )
		{
			$( options.nextBtn ).click( function()
			{
				if( goBoard )
					goBoard.nextTurn();
			} );
		}// End if

		if( options.previousBtn && options.previousBtn.length > 0 )
		{
			$( options.previousBtn ).click( function()
			{
				if( goBoard )
					goBoard.previousTurn();
			} );
		}// End if
		
		return this;
	};
} )( jQuery );