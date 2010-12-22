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
			boardSize: false,
			
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
			turnObjects: new Array(),
			
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

			
			// Called by the parser object, in order of moves, to set the data for each move.
			// This is done in an effort to abstract the details between the loading of the data
			// and the usage of that data.
			setTurnObj: function ( turnObj, branchId )
			{
				// Start thinking about branchs
				if( ! branchId )
					branchId = 1;

				// Add the turn object to the list
				if( this.turnObjects.push( turnObj ) );
			},
		} );// End goBoard object definition
		
		return goBoard;
	}// End function createBoard
} );

})(jQuery);
