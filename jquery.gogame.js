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
		}// End this.goGameNext
		
		// Backs the loaded game up to the previous move
		$.fn.goGamePrevious = function()
		{
			if( goBoard )
				goBoard.previousTurn();
		}// End this.goGamePrevious
		
		// Resets the view to the first move of the game
		$.fn.goGameFirst = function()
		{
			if( goBoard )
				goBoard.firstTurn();
		}// End this.goGameFirst
		
		// Advantances the game to the final move
		$.fn.goGameLast = function()
		{
			if( goBoard )
				goBoard.lastTurn();
		}// End this.goGameLast
		
		// If the next button options are set, plug into it's click event
		if( options.nextBtn && options.nextBtn.length > 0 )
		{
			$( options.nextBtn ).click( function()
			{
				$.fn.goGameNext();
			} );
		}// End if

		// If the previous button options are set, plug into it's click event
		if( options.previousBtn && options.previousBtn.length > 0 )
		{
			$( options.previousBtn ).click( function()
			{
				$.fn.goGamePrevious()
			} );
		}// End if
		
		// If the first button options are set, plug into it's click event
		if( options.firstBtn && options.firstBtn.length > 0 )
		{
			$( options.firstBtn ).click( function()
			{
				$.fn.goGameFirst();
			} );
		}// End if

		// If the last button options are set, plug into it's click event
		if( options.lastBtn && options.lastBtn.length > 0 )
		{
			$( options.lastBtn ).click( function()
			{
				$.fn.goGameLast();
			} );
		}// End if

		return this;
	};
} )( jQuery );