// Author : Chris Tolley
// Date   : 03/15/2010
// Desc   : This file contains a jquery plugin that makes it possible to fetch and parse
//	    a ugf file from a given url on the server.  It is also responsible for generating
//	    go stone objects, passing those objects to the board to generate deltas between turns,
//	    and setting any static game properties avaiable.  It must then let the board know 
//	    when all game info has been entered.

// Requirements: jQuery (ajax calls)

;( function( $ ){

$.extend( {

	// Takes in a url of an sgf file.  It GET's the raw sgf data, parses it into javascript object,
	// and passes that to callback.  callback must take in a single parameter, which will be the game tree data
	loadUGF : function( url, callback )
	{
		// Call the server to get the requested ugf file
		$.get( url, function( data )
		{
			// Takes in a string that is a ugf file and parses the text out into
			// javascript objects and returns it
			function parseUGF( gameFile )
			{
				// If the gameFile isn't set, return
				if( ! gameFile || gameFile.length == 0 )
					return false;
				
				// Split gameFile by newline to get each line of the file
				gameFile = gameFile.split( "\n" );
				
				// If the first element isn't the header marker, return false
				if( $.trim( gameFile.shift() ) != '[Header]' )
				{
					alert( 'no header element found in parseUGF');
					return false;
				}// End if
				
				// The return value
				var gameData = { header: new Array(), body: [] };
				
				// A variable to keep track of whether we are on the header or not
				var inHeader = true;

				// Foreach individual line in the game file
				for( var lineNum in gameFile )
				{
					var currentLine = $.trim( gameFile[ lineNum ] );

					if( currentLine == '[Data]' )
					{
						inHeader = false;
					}// End if
					else
					{
						if( inHeader )
						{
							// Split the current line by equal sign to get
							// the property name/value pair
							var property = currentLine.split( '=' );
							
							if( property.length == 2 )
								gameData.header[ property[0] ] = property[1].split( ',' );
						}// End if
						else
						{
							// Split the current line by comma to get the details of each move
							gameData.body.push( currentLine.split( ',' ) );
						}// End else
					}// End else
				}// End for each line
				
				// Return our game data
				return gameData;
			}// End function parseUGF
			
			// Parse the ugf file into javascript objects
			gameTree = parseUGF( data );
			
			// Define our file object
			var ugfFile = new Object( 
			{
				// The actual game data
				gameTree: gameTree,
				
				// The display elements for the board
				board: false,
				
				// A place holder that keeps track of which node in the game tree we are on.
				currentNode: 0,
				
				// Sets the gameTree data
				setGameTreeData: function( gameTree ){ this.gameTree = gameTree; },
				
				// Returns the gameTree data
				getGameTreeData: function(){ return this.gameTree; },
				
				// Loops over each node in the ugf file and sets all properties on the board, including
				// stones place
				prepBoard: function( board )
				{
					if( ! board )
					{
						alert( 'No board found in prepBoard: board = ' + board );
						return;
					}// End if

					this.board = board;
					
					// Create our player objects
					var playerWhite = this.board.getBlankPlayerObj( 'white' );
					var playerBlack = this.board.getBlankPlayerObj( 'black' );
					
					// Foreach header element, set the properties on the board object
					for( var propertyName in this.gameTree.header )
					{
						// Switch based on the property name
						switch( propertyName )
						{
							// The version type and number of the game file
							case 'Ver':
								break;
							
							// The language this game file is in
							case 'Lang':
								break;
							
							// The encryption type used on this game file
							case 'Crypt':
								// If the game is encrypted, return cause we can't decrypt it
								if( this.gameTree.header[propertyName][1] != 'PLAIN_UGF_FILE' )
								{
									alert( 'Encrypted game found, unable to display it' );
									return false;
								}// End if
								break;
							
							// No idea????
							case 'Code':
								break;
							
							// The title for this game file
							case 'Title':
								this.board.gameName = this.gameTree.header[propertyName][1];
								break;
							
							// The place this game was played at
							case 'Place':
								this.board.location = this.gameTree.header[propertyName][0];
								this.board.event = this.gameTree.header[propertyName][0];
								break;
							
							// The date this game was played on 
							case 'Date':
								this.board.dateTime = this.gameTree.header[propertyName][0];
								break;
							
							// The rule set we are using
							case 'Rule':
								this.board.rulesSet = this.gameTree.header[propertyName][0];
								break;
							
							// The size of the board
							case 'Size':
								if( parseInt( this.gameTree.header[propertyName][0] ) != NaN )
									this.board.setBoardSize( this.gameTree.header[propertyName][0] );
								break;
							
							// The number of handicap stones / komi
							case 'Hdcp':
								this.board.numHandicapStones = this.gameTree.header[propertyName][0];
								this.board.komi = parseFloat( this.gameTree.header[propertyName][1] );
								break;
								
							// The time limit this game was played under
							case 'Ptime':
								break;
							
							// The winner and final score difference
							case 'Winner':
								this.board.result = 
									this.gameTree.header[propertyName][0] + ' ' + parseFloat( this.gameTree.header[propertyName][1] );
								break;
							
							// The number of moves in this game?
							case 'Moves':
								break;
							
							// The author, or editing software, that created this game file
							case 'Writer':
								this.board.author = this.gameTree.header[propertyName][0];
								break;
							
							// The copyright owner of this game
							case 'Copyright':
								this.board.copyrightInfo = this.gameTree.header[propertyName][0];
								break;
							
							// The type of coordinate system used in this game file
							case 'CoordinateType':
								break;
							
							// A comment about this game
							case 'Comment':
								// Note: turnObj doesn't exist yet
//								if( this.gameTree.header[propertyName].length > 0 )
//									turnObj.addComment( this.gameTree.header[propertyName][0] );
								break;
							
							// Name and rank of the black player
							case 'PlayerB':
								playerBlack.name = this.gameTree.header[propertyName][0];
								playerBlack.rank = this.gameTree.header[propertyName][1];
								playerBlack.teamName = this.gameTree.header[propertyName][3];
								break;
							
							// Name and rank of the white player
							case 'PlayerW':
								playerWhite.name = this.gameTree.header[propertyName][0];
								playerWhite.rank = this.gameTree.header[propertyName][1];
								playerWhite.teamName = this.gameTree.header[propertyName][3];
								break;
						}// End switch property name
					}// End for each header property
					
					// If the board size isn't set, return false
					if( ! this.board.size || this.board.size <= 0 )
					{
						alert( 'No board size found in UGF file' );
						return;
					}// End if
					
					// Send the player information to the board
					this.board.playerBlack = playerBlack;
					this.board.playerWhite = playerWhite;
					
					// Foreach element in the Data (body) of the game, set it's information on the board object
					for( var n in this.gameTree.body )
					{
						// Get a shortcut to the information about this move
						var turnData = this.gameTree.body[n];

						// If we have all the data we are expecting
						if( turnData.length == 4 )
						{
							turnData[0] = turnData[0].toLowerCase();

							// Create a blank stone, so we can set the properties here
							var goStone = this.board.getBlankStone();

							// Get a blank turn object to fill in and pass to the board to calculate the deltas
							var turnObj = this.board.getBlankTurnObject();

							// Get the coordinates of the move and send them to the board
							goStone.x = turnData[0].charAt( 0 );
							goStone.y = turnData[0].charAt( 1 );
							
							// Translate the go stone coordinates from alpha to numeric
							goStone.x = parseInt( goStone.x.charCodeAt( 0 ) ) - 97;
							goStone.y = parseInt( goStone.y.charCodeAt( 0 ) ) - 97;
							
							// Invert the coordinates so the game won't render upside down
//							goStone.x = 20 - goStone.x;
							goStone.y = 18 - goStone.y;
							
							// Set the color of the stone
							if( turnData[1].toLowerCase().charAt( 0 ) == 'w' )
								goStone.color = 'w';
							else
								goStone.color = 'b';
							
							// If the coordinates of the stone are out of range, treat it as a pass
							if( goStone.x >= this.board.size || goStone.y >= this.board.size )
								goStone.action = 'pass';
							else
								goStone.action = 'place';

							// Set the turn object in the board
							turnObj.stone = goStone;
							this.board.setTurnObj( n, turnObj );
						}// End if
					}// End for n
					
					// Let the board know we are finished parsing
					this.board.onParserFinish();
					
					// If we have any handicap stones, advance the game past them
					if( this.board.numHandicapStones > 0 )
					{
						for( var n = 0; n < this.board.numHandicapStones; ++n )
						{
							this.board.nextTurn();
						}// End for n
					}// End if
					
					// Mark the current turn as the "first" turn so user's go before it
					this.board.markFirstTurn();
				}// End function prepBoard
			} );
			
			// Pass the ugf file to the callback function
			callback( ugfFile );
		} );
	}// End function load UGF
} );
})(jQuery);