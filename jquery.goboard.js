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
			dim: 20,
			format: 'sgf',
			gameUrl: '',
			cellDim: 20
		}, options );

		// The go board object definition
		var goBoard = new Object( {
			// A flag that, when set to false, will turn off the updating of the UI
			updateUIElements: true,

			// Set to true when the game file has been loaded, and is ready for commands
			loaded: false,

			// The internal representation of the state of the board
			boardSize: false,
			
			// The initial turn object, used to store handy cap stones, or pre game comments
			initialTurn: false,
			
			// Keeps track of the turn we are on
			turnIndex: 0,
			
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
			
			// The element that displays the black player's capture count
			playerBlackCaptureElem: false,
			
			// The element that holds the black player's time remaining
			playerBlackTimeRemaining: false,
			
			// The object that holds the white player's information
			playerWhite: false,
			
			// The element that holds the white player's information
			playerWhitePanel: false,
			
			// The element that displays the white player's capture count
			playerWhiteCaptureElem: false,
			
			// The element that holds the white player's time remaining
			playerWhiteTimeRemaining: false,
			
			// The element that will hold the information about the most recently played stone
			turnInfoPanel: false,
			
			// A flag set to true when we are to mark the most recently played stone
			markCurrentStone: true,	
			
			// The internal represenation of the board.  This helps do capture logic and such
			internalBoard: false,

			/////////////////////////////////////////////////////////////////////////////////
			/////////////////////////// Begin parser interface methods///////////////////////
			/////////////////////////////////////////////////////////////////////////////////
			
			// Returns an empty game tree/branch.  This method is used by parsers to create subtrees/branches
			getNewBranch: function()
			{
				return new Array();
			},// End function getNewBranch
			
			// Called by the parser to get blank stone objects.  These are the stones
			// that will be passed back to the board attached to a turn object
			getBlankStone: function()
			{
				return { x: 	  false, 
					 y: 	  false, 
					 color:    false, 
					 action:   false, 
					 capturedStones: {},
					 
					 // Returns the index value that is used in the capture logic
					 getIndex: function()
					 {
					 	// If this stone doesn't have coordinates, return false
						if( this.action == 'pass' )
							return false;
						
						// Convert the numeric x value into an alpha string, and there are no I's in go coordinates
						var charCodeX = this.x;
						if( parseInt( charCodeX ) >= 9 )
							charCodeX++;
			
						// Convert the numeric y value into an alpha string, and there are no I's in go coordinates
						var charCodeY = this.y;
						if( parseInt( charCodeY ) >= 9 )
							charCodeY++;
						
						// Return the index value
						return String.fromCharCode( charCodeX + 96 ) + String.fromCharCode( charCodeY + 96 );
					 }// End function getIndex
				};
			}, // End getBlankStone
			
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
					
					// An array to hold sub trees/branches
					subTrees: new Array(),
					 
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
			}, // End getBlankTurnObject
   
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
			}, // End getBlankPlayerObj

			
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
			}, // End setTurnObj
			
			// Returns a blank liberty object.  These are used in the internalBoard to do
			// capture logic, and board display
			getBlankLibertyObject: function()
			{
				return {
					state: 'open',
					displayElem: false,
					openClassName: false,
					whiteClassName: false,
					blackClassName: false,
					stone: false,
				
					playOn: function( stone )
					{
						this.stone = stone;

						switch( stone.color )
						{
							case 'b':
								this.displayElem.className = this.blackClassName;
								this.state = 'black';
								break;
							case 'w':
								this.displayElem.className = this.whiteClassName;
								this.state = 'white';
								break;
						}// End switch color
					},// End function playOn
					
					open: function()
					{
						this.stone = false;
						this.displayElem.className = this.openClassName;
						this.state = 'open';
					},// End function open
				};
			}, // End function getBlankLibertyObject

			/////////////////////////////////////////////////////////////////////////////////
			//////////////////////// End parser interface methods ///////////////////////////
			/////////////////////////////////////////////////////////////////////////////////
			
			/////////////////////////////////////////////////////////////////////////////////
			////////////////////////// Begin board display methods //////////////////////////
			/////////////////////////////////////////////////////////////////////////////////
			
			// Called by the main jquery plugin to display this game
			display: function()
			{
				// If the board size isn't set, let the user know
				if( ! this.boardSize )
				{
					alert( 'Board Size not found' );
					return;
				}// End if

				// Make sure we have a place to display our board
				if( ! elem )
				{
					alert( 'Display element not find in goboard.display()' );
					return;
				}// End if

				// Save a reference to our go board display element, apply the 
				// goban class, and clean out any child elements it may have
				this.boardElem = elem;
				$( this.boardElem ).addClass( 'goban' );
				while( this.boardElem.firstChild )
						this.boardElem.removeChild( this.boardElem.firstChild );

				// Calculate the max dimensions for the board plus coordinates
				var xMax = this.boardSize + 2;
				var yMax = this.boardSize + 2;

				// Set the style information on the element the board will display inside of
				this.boardElem.style.height = String( xMax * 20 ) + 'px';
				this.boardElem.style.width = String( yMax * 20 ) + 'px';
				
				// Initialize the UI based on the options passed into the jquery method call
				this.initializeDisplay();

				// Generate the internal board representation and the display elements
				this.internalBoard = new Array();
				for( var y = 0; y < yMax; ++y )
				{
					for( var x = 0; x < xMax; ++x )
					{
						if( ! ( this.internalBoard[x] instanceof Array ) )
							this.internalBoard[x] = new Array();
						
						// Create the display element for this liberty
						var newTile = this.createBoardTile( x, y );

						// If we have a side coordinate (not actually a liberty)
						if( x == 0 || y == 0 || x == ( this.boardSize + 1 ) || y == ( this.boardSize + 1 ) )
						{
							// Make the tile empty, and add the proper coordinate display
							newTile.className = 'tile blank';
							newTile.innerHTML = this.calculateSideCoordinate( x, y );
							
							// Add the new tile to the display
							this.boardElem.appendChild( newTile );
						}// End if
						else
						{
							// Otherwise, add the appropiate class to the tile for its position on the board
							var tileClass = 'tile liberty ' + this.calculateLibertyClass( x, y );

							newTile.className = tileClass;
							newTile.innerHTML = '&nbsp;';

							// Create the actual liberty object that will hold all the tiles for this liberty
							var liberty = this.getBlankLibertyObject();

							// Set the class names and the display element on the liberty object
							liberty.displayElem = newTile;
							liberty.openClassName = tileClass;
							liberty.blackClassName = 'tile liberty black';
							liberty.whiteClassName = 'tile liberty white';
							liberty.x = x;
							liberty.y = y;

							// Append the display element to the DOM
							this.boardElem.appendChild( liberty.displayElem );

							// Add our liberty to the internal board
							this.internalBoard[x][y] = liberty;
						}// End else
					}// End for y
				}// End for x
				
				// If we have an initial turn, set the display accordingly
				if( this.initialTurn )
				{
					this.playTurn( this.initialTurn );
				}// End if
			}, // End function display
			
			// Creates and positions the DOM elements the give coordinates
			createBoardTile: function( x, y )
			{
				// Create a div element for the liberty element
				var newTile = document.createElement( 'div' );
				
				// Calculate the position of this liberty in the display
				var position = this.calculateTileCoordinates( x, y );
				newTile.style.left = position.left;
				newTile.style.top = position.top;
				
				return newTile;
			}, // End function createBoardTile

			// Returns the top and left coordinates for a given liberty
			calculateTileCoordinates: function( x, y )
			{
				var returnValue = { top: 0, left: 0 };
				
				// Get the offset of the DOM element that holds the board UI
				var gobanPosition = $( this.boardElem ).offset();
				
				returnValue.left = ( 20 * y ) + gobanPosition.left + 1;
				returnValue.top = ( 20 * x ) + gobanPosition.top + 1;
				
				return returnValue;
			}, // End function calculateTileCoordinates
			
			// A function that will return the proper innerHTML for the side coordinates
			calculateSideCoordinate: function( x, y )
			{
				// The return value
				var innerHTML = '&nbsp;';
				
				// The maximum for x and y with the boardSize
				var xMax = this.boardSize + 1;
				var yMax = this.boardSize + 1;
			
				// In building the side coordinates, we have to make sure not to set an innerHTML for the corner tiles.
				// The corner tiles are left blank so that the coordinates will line up with the liberty the coorespond to
			
				// If we are on the top row, and it's not a tile
				if( x == 0 && ( y != 0 && y != yMax ) )
				{
					// Theres no i in the coordinates
					if( y >= 9 )
						y++;
					innerHTML = String.fromCharCode( y + 64 );
				}// End if
				
				// If we are on the bottom row, and it's not a tile
				else if( x == xMax && ( y != 0 && y != yMax ) )
				{
					// Theres no i in the coordinates
					if( y >= 9 )
						y++;
					innerHTML = String.fromCharCode( y + 64 );
				}// End if
				
				// If we are on the left side, and it's not a tile
				else if( y == 0 && ( x != 0 && x != xMax ) )
					innerHTML = x;
				
				// If we are on the right side, and it's not a tile
				else if( y == yMax && ( x != 0 && x != xMax ) )
					innerHTML = x;
			
				return innerHTML;
			}, // End function calculateSideCoordinate

			// A function that will calculate the proper className to give to a liberty tile
			// based on the coordinates past in, and return it.
			calculateLibertyClass: function( x, y )
			{
				// The default liberty className
				var className = 'c';
			
				// If the tile is on the top row
				if( x == 1 )
				{
					// If we have the top left tile
					if( y == 1 )
						className = 'tl';
					// If we have the top right tile
					else if( y == this.boardSize )
						className = 'tr';
					else
						className = 't';
				}// End if
				// If the tile is on the bottom row
				else if( x == this.boardSize )
				{
					// If we have the bottom left tile
					if( y == 1 )
						className = 'bl';
					// If we have the bottom right tile
					else if( y == this.boardSize )
						className = 'br';
					else
						className = 'b';
				}// End if
				// If we have a left side tile
				else if( y == 1 )
					className = 'l';
				// If we have a right side tile
				else if( y == this.boardSize )
					className = 'r';
				else
				{
					// Otherwise, we have to check for a star point
			
					// Calculate the center of the board
					var center = Math.ceil( ( this.boardSize ) / 2 );
					
					// The value for corner star points
					var cornerStar = ( this.boardSize >= 13 )? 4: 3;
					
					// Top star points
					if( x == cornerStar )
					{
						if( y == cornerStar )
							className = 'cs';
						else if( y == ( this.boardSize - ( cornerStar - 1 ) ) )
							className = 'cs';
						else if( y == center && this.boardSize >= 17 )
							className = 'cs';
					}// End else if
					// Middle star points
					else if( x == center )
					{
						if( y == 4 && this.boardSize >= 17 )
							className = 'cs';
						else if( y == ( this.boardSize - 3 ) && this.boardSize >= 17 )
							className = 'cs';
						else if( y == center )
							className = 'cs';
					}// End else if
					// Bottom star points
					else if( x == ( this.boardSize - ( cornerStar - 1 ) ) )
					{
						if( y == cornerStar )
							className = 'cs';
						else if( y == ( this.boardSize - ( cornerStar - 1 ) ) )
							className = 'cs';
						else if( y == center && this.boardSize >= 17 )
							className = 'cs';
					}// End else if
				}// End else
				
				// Add the info that the board engine will use to display the turns
				// Note: This code should stay at the very end of this function because we are incrementing x and y
			
				// There are no I's in go coordinates
				if( x >= 9 )
					x++;
				
				if( y >= 9 )
					y++;
			
				// Return the calculated className
				return className;
			}, // End function calculateLibertyClass
			
			
			// Initializes the the display elements based on the options used when this object was created
			initializeDisplay: function()
			{
				// Set the reference to the chat window, if one is set
				if( options.chatWindow && options.chatWindow.length > 0 )
				{
					var temp = $( options.chatWindow );
					if( temp.length > 0 )
						this.chatWindow = temp[0];
				}// End if
				
				// If the game info element selector is set in the options
				if( options.gameInfo && options.gameInfo.length > 0 )
				{
					// Build the game info panel content
					var gameInfoContent = 'Game: ' + this.gameName +
							' played on ' + this.dateTime;
					
					
					if( this.timeLimit || this.komi || this.numHandicapStones )
					{
						gameInfoContent += '<br />';

						// If the time limit is set, display them it in the info panel
						if( this.timeLimit )
							gameInfoContent += 'Time Limit: ' + this.timeLimit
						
						// If the komi is set, display it
						if( this.komi )
						{
							gameInfoContent += ' Komi: ' + this.komi;
						}// end if
						
						// If there are handicap stones, display it
						if( this.numHandicapStones )
							gameInfoContent += ' Handicap: ' + this.numHandicapStones;
					}// End if

					this.gameInfoPanel = $( options.gameInfo ).html( gameInfoContent ).
									addClass( 'gameInfoPanel' );
				}// End if
				
				// If the black player info panel selector is set in the options
				if( options.blackInfo && options.blackInfo.length > 0 )
				{
					var blackInfoContent = 'Black: ' + this.playerBlack.name + 
							' (' + this.playerBlack.rank + ') <br />' +
							'Captures: <span class="black_captures">0</span><br />';
					
					// Set the initial time limit for the black player
					blackInfoContent += 'Time Remaining: <span class="player_black_timeremaining">' + this.timeLimit + '</span>';

					this.playerBlackPanel = $( options.blackInfo ).html( blackInfoContent ).
									addClass( 'playerInfoPanel' );
					
					// Store a reference to the element that displays black's time remaining
					this.playerBlackTimeRemaining = $( this.playerBlackPanel ).find( '.player_black_timeremaining' );
					
					// Store a reference to the element that displays black's capture count
					this.playerBlackCaptureElem = $( this.playerBlackPanel ).find( '.black_captures' );
				}// End if
				
				// If the white player info panel selector is set in the options
				if( options.whiteInfo && options.whiteInfo.length > 0 )
				{
					var whiteInfoContent = 'White: ' + this.playerWhite.name + 
							' (' + this.playerWhite.rank + ') <br />' +
							'Captures: <span class="white_captures">0</span><br />';
					
					// Set the initial time limit for the black player
					whiteInfoContent += 'Time Remaining: <span class="player_white_timeremaining">' + this.timeLimit + '</span>';

					this.playerWhitePanel = $( options.whiteInfo ).html( whiteInfoContent ).
									addClass( 'playerInfoPanel' );
					
					// Store a reference to the element that displays white's time remaining
					this.playerWhiteTimeRemaining = $( this.playerWhitePanel ).find( '.player_white_timeremaining' );
					
					// Store a reference to the element that displays white's capture count
					this.playerWhiteCaptureElem = $( this.playerWhitePanel ).find( '.white_captures' );
				}// End if
				
				// If the turn info panel was specified
				if( options.turnInfo && options.turnInfo.length > 0 )
				{
					var turnInfoContent = 'Move: N/A';
					
					this.turnInfoPanel = $( options.turnInfo ).html( turnInfoContent ).addClass( 'gameInfoPanel' );
				}// End if
				
				// Plug into the keyboard events
				$( document ).bind( 'keypress', { goboard: this }, this.handleKeyPress );
			},// End function initializeDisplay
			
			// If the player info panel element is set, this function updates the number
			// of captures displayed for that player
			updateCaptureDisplay: function()
			{
				// Update each player's capture display element
				this.playerBlackCaptureElem.html( this.playerBlack.captures );
				this.playerWhiteCaptureElem.html( this.playerWhite.captures );
			}, // End function updateCaptureDisplay
			
			// Adds a comment to the chat window
			addCommentToDisplay: function( comment )
			{
				if( this.chatWindow )
				{
					this.chatWindow.value = comment;
					this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
				}// End if
			}, // End function addCommentToDisplay
			
			// Clears all comments from the chat window
			clearCommentsFromDisplay: function( comment )
			{
				if( this.chatWindow )
				{
					this.chatWindow.value = '';
				}// End if
			}, // End function clearCommentsFromDisplay
			
			// Called by jquery whenever a keyboard key is pressed
			handleKeyPress: function( e )
			{
				// Set the scope of the "this" keyword to the goboard
				if( ! e || ! e.data || ! e.data.goboard )
					return true;

				// A flag to indicate whether or not we've handled the current key press
				var bHandled = false;

				// Switch based on the key that was pressed
				switch( e.keyCode )
				{
					// The left arrow key, reverse the game one move
					case 37:
						e.data.goboard.previousTurn();
						bHandled = true;
						break;
					
					// The right arrow key, advance the game one move
					case 39:
						e.data.goboard.nextTurn();
						bHandled = true;
						break;
					
					// The up arrow key, advance the game to the end
					case 38:
						e.data.goboard.firstTurn();
						bHandled = true;
						break;
					
					// The down arrow key, reverse the game to the beginning
					case 40:
						e.data.goboard.lastTurn();
						bHandled = true;
						break;

					// See if the keycode matches a subtree
					default:
//						console.log( e.keyCode );
						break;
				}// End switch character code
				
				// If we handled the current key press, prevent the key event's default behaviour
				if( bHandled )
				{
					e.preventDefault();
					e.stopPropagation();
					return false;
				}// End if
				else
					return true;
			},// End function handleKeyPress
			
			/////////////////////////////////////////////////////////////////////////////////
			//////////////////////////// End board display methods///////////////////////////
			/////////////////////////////////////////////////////////////////////////////////
			
			/////////////////////////////////////////////////////////////////////////////////
			/////////////////////////// Begin turn interface methods ////////////////////////
			/////////////////////////////////////////////////////////////////////////////////
			
			// Takes in a turn object and sets the internal state of the board accordingly
			playTurn: function( turnObj )
			{
				// If we have a stone object, play it
				if( turnObj.stone )
				{
					// Place the stone on the board and determine if any stones were captured
					this.placeStone( turnObj.stone );
					var capturedStones = this.removeStonesCapturedBy( turnObj.stone );
					
					// Add any captured stones to the stone's list of captured stones and update
					// the appropiate player's capture count
					var bUpdateCaptureUI = false;
					for( var index in capturedStones )
					{
						bUpdateCaptureUI = true;
						turnObj.stone.capturedStones[index] = capturedStones[index];
						
						if( capturedStones[index].color == 'w' )
							this.playerBlack.captures++;
						else
							this.playerWhite.captures++;
					}// End foreach captured stone
					
					// If we need to update the capture display, do so
					if( bUpdateCaptureUI )
						this.updateCaptureDisplay();
				}// End if

				// If we have additional stones to play, play them
				if( turnObj.additionalBlackStones && turnObj.additionalBlackStones.length > 0 )
				{
					for( var n = 0; n < turnObj.additionalBlackStones.length; ++n )
					{
						this.placeStone( turnObj.additionalBlackStones[n] );
						this.removeStonesCapturedBy( turnObj.additionalBlackStones[n] );
					}// End foreach additional black stone
				}// End if additional black stones
				
				if( turnObj.additionalWhiteStones && turnObj.additionalWhiteStones.length > 0 )
				{
					for( var n = 0; n < turnObj.additionalWhiteStones.length; ++n )
					{
						this.placeStone( turnObj.additionalWhiteStones[n] );
						this.removeStonesCapturedBy( turnObj.additionalWhiteStones[n] );
					}// End foreach additional white stone
				}// End if additional white stones
				
				// Update any UI elements that where specified specified in the input options with 
				this.updatePlayerUI( turnObj );
				
				// Test code: show the number of subtrees
				if( turnObj.subTrees.length > 0 )
				{
					$( '#tempdisplay' ).html( 'num sub trees: ' + turnObj.subTrees.length );
				}// End if
				else
					$( '#tempdisplay' ).html( '' );
			},// End function playTurn
			
			// Takes in a turn object and unsets the internal state of the board accordingly
			unPlayTurn: function( turnObj )
			{
				// If we have a stone object
				if( turnObj.stone )
				{
					// Remove the stone object from the board and replace any stones that it captured
					this.unPlaceStone( turnObj.stone );
					
					// Foreach stone that was captured by the stone we just removed from the board
					var bUpdateCaptureUI = false;
					for( var index in turnObj.stone.capturedStones )
					{
						this.placeStone( turnObj.stone.capturedStones[index] );
						
						bUpdateCaptureUI = true;
						
						if( turnObj.stone.capturedStones[index].color == 'w' )
							this.playerBlack.captures--;
						else
							this.playerWhite.captures--;
						
						// Make sure our capture counts stay positive
						if( this.playerBlack.captures < 0 )
							this.playerBlack.captures = 0;
						if( this.playerWhite.captures < 0 )
							this.playerWhite.captures = 0;
						
						// Remove the once captured stone from the capture list
						delete turnObj.stone.capturedStones[index];
					}// End for index
					
					// If we need to update the capture display, do so
					if( bUpdateCaptureUI )
						this.updateCaptureDisplay();
				}// End if

				// If we have additional stones, unplay them
				if( turnObj.additionalBlackStones && turnObj.additionalBlackStones.length > 0 )
				{
					for( var n = 0; n < turnObj.additionalBlackStones.length; ++n )
					{
						this.unPlaceStone( turnObj.additionalBlackStones[n] );
					}// End foreach additional black stone
				}// End if additional black stones
				
				if( turnObj.additionalWhiteStones && turnObj.additionalWhiteStones.length > 0 )
				{
					for( var n = 0; n < turnObj.additionalWhiteStones.length; ++n )
					{
						this.unPlaceStone( turnObj.additionalWhiteStones[n] );
					}// End foreach additional white stone
				}// End if additional white stones
				
				// Update any UI elements that where specified specified in the input options
				this.updatePlayerUI( turnObj );
			}, // End function unPlayTurn

			// Called by the jquery plugin interface to advance the game a turn
			nextTurn: function()
			{
				this.playTurn( this.turnObjects[ this.turnIndex ] );
				
				// Increment the turn index
				this.turnIndex++;
				
				// Make sure the turn index stays in bounds
				if( this.turnIndex >= this.turnObjects.length )
					this.turnIndex = this.turnObjects.length - 1;
			}, // End function nextTurn
			
			// Called by the jquery plugin interface to reverse the game a turn
			previousTurn: function()
			{
				// Make sure we don't keep trying to replay the first turn over and over
				// when the user hit's previous
				if( this.turnIndex == 0 )
					return;

				// Deincrement the turn index and make sure it stays in range
				this.turnIndex--;

				if( this.turnIndex < 0 )
					this.turnIndex = 0;
				
				this.unPlayTurn( this.turnObjects[ this.turnIndex ] );

				// If we are at the first turn of the game
				if( this.turnIndex == 0 )
				{
					// If we have an initial turn, set the display accordingly
					if( this.initialTurn )
					{
						this.playTurn( this.initialTurn );
						this.updatePlayerUI( this.initialTurn );
						
						// Update the time remaining UI elements to show the initial time again
						this.playerBlackTimeRemaining.html( this.timeLimit );
						this.playerWhiteTimeRemaining.html( this.timeLimit );
					}// End if
				}// End if
				else
				{
					// Otherwise, update the board UI with the previous turns info
					this.updatePlayerUI( this.turnObjects[ this.turnIndex - 1 ] );
				}// End else
			}, // End function previous turn
			
			// Called by the jquery plugin interface to move the game to the last turn
			lastTurn: function()
			{
				// Turn off UI updates to speed up execution
				this.updateUIElements = false;

				// Move to the 2nd to last move
				while( this.turnIndex < this.turnObjects.length - 3 )
					this.nextTurn();
				
				// Turn the UI updates back on and play the final turns
				this.updateUIElements = true;
				this.nextTurn();
				this.nextTurn();
			}, // End function lastTurn

			// Called by the jquery plugin interface to move the game to the first turn
			firstTurn: function()
			{
				// Turn off UI updates to speed up execution
				this.updateUIElements = false;
				
				// Move the game back to the 2nd move
				while( this.turnIndex > 1 )
					this.previousTurn();
				
				// Turn UI updates back on and play the first turn
				this.updateUIElements = true;
				this.previousTurn();
				
				// If we have an initial turn, set the display accordingly
				if( this.initialTurn )
				{
					this.playTurn( this.initialTurn );
				}// End if
			}, // End function firstTurn

			// Called by the jquery plugin interface to advance the game to an arbirtary move
			jumpToTurn: function( n )
			{
				// No interface for this yet
			},// End function jumpToTurn
			
			// Applies the information the turn object to the board's UI elements
			updatePlayerUI: function( turnObj )
			{
				// If the board was instructed not to update the display, don't
				if( ! this.updateUIElements )
					return;

				// If we have comments, add them to the chat window
				if( turnObj.comments && turnObj.comments.length > 0 )
					this.addCommentToDisplay( turnObj.comments );
				else
					this.clearCommentsFromDisplay();

				// If the time remaining is set in the turn, update the correct player's time remaining
				if( turnObj.timeRemaining )
				{
					if( turnObj.stone.color == 'b' )
						this.playerBlackTimeRemaining.html( turnObj.timeRemaining );
					else
						this.playerWhiteTimeRemaining.html( turnObj.timeRemaining );
				}// End if
			},// End function updatePlayerUI
			
			/////////////////////////////////////////////////////////////////////////////////
			/////////////////////////// End turn interface methods //////////////////////////
			/////////////////////////////////////////////////////////////////////////////////

			/////////////////////////////////////////////////////////////////////////////////
			//////////////////////////// Begin turn logic methods ///////////////////////////
			/////////////////////////////////////////////////////////////////////////////////
			
			// Adjusts the display elements necessary to display the placing of the given stone object
			placeStone: function( stone )
			{
				// If the stone is not a pass add it to the board
				if( stone.action != 'pass' )
					this.internalBoard[ stone.x ][ stone.y ].playOn( stone );
			}, // End function placeStone
			
			// Adjusts the display elements necessary to display the removal of a given stone object
			unPlaceStone: function( stone )
			{
				// If the stone is not a pass, play it on the specified liberty
				if( stone.action != 'pass' )
					this.internalBoard[ stone.x ][ stone.y ].open();
			}, // End function unPlaceStone
			
			// Removes any stones captured by currentStone.  This method is called when a stone is
			// played.
			removeStonesCapturedBy: function( currentStone )
			{
				// The return value
				var captured = {};

				// Get a shortcut to the stone's coordinates
				var x = currentStone.x;
				var y = currentStone.y;

				// Create a list of all neighboring stones
				var neighbors = new Array();
				if( this.internalBoard[x] && this.internalBoard[x][y + 1] )
				{
					if( this.internalBoard[x][y + 1].stone && 
					    this.internalBoard[x][y + 1].stone.color != currentStone.color )
						neighbors.push( this.internalBoard[x][y + 1].stone );
				}// End if
				
				if( this.internalBoard[x] && this.internalBoard[x][y - 1] )
				{
					if( this.internalBoard[x][y - 1].stone &&
					    this.internalBoard[x][y - 1].stone.color != currentStone.color )
						neighbors.push( this.internalBoard[x][y - 1].stone );
				}// End if
				
				if( this.internalBoard[x + 1] && this.internalBoard[x + 1][y] )
				{
					if( this.internalBoard[x + 1][y].stone && 
					    this.internalBoard[x + 1][y].stone.color != currentStone.color )
						neighbors.push( this.internalBoard[x + 1][y].stone );
				}// End if
				
				if( this.internalBoard[x - 1] && this.internalBoard[x - 1][y] )
				{
					if( this.internalBoard[x - 1][y].stone &&
					    this.internalBoard[x - 1][y].stone.color != currentStone.color )
						neighbors.push( this.internalBoard[x - 1][y].stone );
				}// End if

				// Foreach neighbor, if it's an enemy, check to see if it was captured
				while( neighbors.length > 0 )
				{
					var currentNeighbor = neighbors.pop();
					
					// If this stone hasn't already been captured
					if( ! captured[ currentNeighbor.getIndex() ] )
					{
						var capturedList = this.isCaptured( currentNeighbor );

						for( var index in capturedList )
							captured[index] = capturedList[index];
					}// End if
				}// End while

				// Foreach stone that needs to be removed, remove it from the internal board
				for( var index in captured )
					this.unPlaceStone( captured[index] );

				return captured;
			},// End function removeStonesCapturedBy
			

			// Returns a list of stones if target is part of a group of captured stones, false otherwise
			isCaptured: function( targetStone )
			{
				// Create a queue to hold the stones connected to our target stone
				var queue = new Array();
				
				// Create a list to hold the stones that have been checked.
				var checkedList = {};
				
				// A variable to keep track of the number of open liberties
				var openLibertyCount = 0;
				
				// Add our first node onto the queue and onto the checked list
				queue.push( targetStone );
				checkedList[ targetStone.getIndex() ] = targetStone;
				
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

					if( this.internalBoard[x] && this.internalBoard[x][y + 1] )
					{
						if( this.internalBoard[x][y + 1].stone )
							neighbors.push( this.internalBoard[x][y + 1].stone );
						else
							openLibertyCount++;
					}// End if
					
					if( this.internalBoard[x] && this.internalBoard[x][y - 1] )
					{
						if( this.internalBoard[x][y - 1].stone )
							neighbors.push( this.internalBoard[x][y - 1].stone );
						else
							openLibertyCount++;
					}// End if
					
					if( this.internalBoard[x + 1] && this.internalBoard[x + 1][y] )
					{
						if( this.internalBoard[x + 1][y].stone )
							neighbors.push( this.internalBoard[x + 1][y].stone );
						else
							openLibertyCount++;
					}// End if
					
					if( this.internalBoard[x - 1] && this.internalBoard[x - 1][y] )
					{
						if( this.internalBoard[x - 1][y].stone )
							neighbors.push( this.internalBoard[x - 1][y].stone );
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
							if( ! checkedList[ currentNeighbor.getIndex() ] )
							{
								checkedList[ currentNeighbor.getIndex() ] = currentNeighbor;
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
			},// End function isCaptured
			
			/////////////////////////////////////////////////////////////////////////////////
			////////////////////////////// End turn logic methods ///////////////////////////
			/////////////////////////////////////////////////////////////////////////////////
			
			// A function so that I won't have to remember to move my last comma
			// Don't forget to take this out before you call it finished
			commaBait: function(){}
		} );// End goBoard object definition
		
		return goBoard;
	}// End function createBoard
} );

})(jQuery);
