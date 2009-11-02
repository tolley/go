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
						gameFile.prepBoard( goBoard );
					} );
					break;
				default:
					alert( 'Unrecognized file type "' + options.format + '"' );
			}// End switch file format
		}// End if
		
		console.log( goBoard );
		
		// Returns true if the game file has been loaded and is ready for interaction
		$.fn.isGameLoaded = function()
		{
			if( goBoard )
				return goBoard.loaded;
			else
				return false;
		}// End this.isGameLoaded
		
		// Advances the loaded game to the next move
		$.fn.nextTurn = function()
		{
			if( goBoard )
				goBoard.nextTurn();
		}// End this.nextTurn
		
		// Backs the loaded game up to the previous move
		$.fn.previousTurn = function()
		{
			if( goBoard )
				goBoard.previousTurn();
		}// End this.previousTurn
		
		// Resets the view to the first move of the game
		$.fn.firstTurn = function()
		{
			if( goBoard )
				goBoard.firstTurn();
		}// End this.firstTurn
		
		// Advantances the game to the final move
		$.fn.lastTurn = function()
		{
			if( goBoard )
				goBoard.lastTurn();
		}// End this.lastTurn
		
		// Updates the view so that it will shows the n'th move
		$.fn.jumpToTurn = function( n )
		{
			if( goBoard )
				goBoard.jumpToTurn( n );
		}// End this.jumpToTurn
		
		// If the next button options are set, plug into it's click event
		if( options.nextBtn && options.nextBtn.length > 0 )
		{
			$( options.nextBtn ).click( function()
			{
				$.fn.nextTurn();
			} );
		}// End if

		// If the previous button options are set, plug into it's click event
		if( options.previousBtn && options.previousBtn.length > 0 )
		{
			$( options.previousBtn ).click( function()
			{
				$.fn.previousTurn();
			} );
		}// End if
		
		// If the first button options are set, plug into it's click event
		if( options.firstBtn && options.firstBtn.length > 0 )
		{
			$( options.firstBtn ).click( function()
			{
				$.fn.firstTurn();
			} );
		}// End if

		// If the last button options are set, plug into it's click event
		if( options.lastBtn && options.lastBtn.length > 0 )
		{
			$( options.lastBtn ).click( function()
			{
				$.fn.lastTurn();
			} );
		}// End if

		return this;
	};
} )( jQuery );