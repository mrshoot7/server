var utils = require(__base + 'utils');
var errorResponse = require(__base + 'errors').response;
var Player = require(__base + 'app/schemes/Player').Player;
var Game = require(__base + 'app/schemes/Game').Game;
var Security = require(__base + 'app/security/security').Security;

exports.Initialize = function(app)
{
    // function to create a new game request
    function createGameRequest(playerID, topicID, res)
    {
        // make an insert request
        DB.collection('game_requests').insert(
        {
            player_id: playerID,
            topic: parseInt(topicID),
            last_update: utils.GetTimestamp()
        }, function(err)
        {
            if (err)
                throw err;

            // generate an empty response
            var response = utils.GetEmptyResponse();

            // fill a data
            response.status = "searching";

            // send a response
            res.send(response);
        })
    }

    function readyGameResponse(game, me, res)
    {
        // get opponent id (opponent is not a player who made a request)
        var opponentID = game.player1.id == me.GetID() ? game.player2.id : game.player1.id;

        var opponent = new Player();

        opponent.SetID(opponentID);

        opponent.Pull(function()
        {
            if (opponent.IsInstantiated)
            {
                // generate an empty response
                var response = utils.GetEmptyResponse();

                // fill a data
                response.status = "ready";
                response.game = game;
                response.game.me = me.GetPublicData();
                response.game.opponent = opponent.GetPublicData();

                // send a response
                res.send(response);
            }
            else
            {
                errorResponse(res, 7);
            }
        });
    }

    // method to find a new game
    app.post('/find-game', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            var requestedTopicID = parseInt(req.body.topic);
            var requestedPlayerToken = req.body.token;

            // find a player by a token from a request
            var player = new Player();

            player.PullByToken(requestedPlayerToken, function()
            {
                if (player.IsInstantiated)
                {
                    // make a request with conditions
                    DB.collection('game_requests').find(
                    {
                        topic: requestedTopicID, // find a game request with the requested topic
                        last_update:
                        {
                            $gt: utils.GetTimestamp() - 5000
                        } // find a request which was updated in last 5 sec
                    }).toArray(function(err, requests)
                    {
                        if (err)
                            throw err;

                        // if a requests are found
                        if (requests.length > 0)
                        {
                            // set flag to true by default
                            var createNewRequest = true;

                            // for each request
                            for (var i = requests.length - 1; i >= 0; i--)
                            {
                                // if it is my request
                                if (requests[i].player_id == player.GetID())
                                {
                                    // if game is created
                                    if (requests[i].created_game_id)
                                    {
                                        var game = new Game();

                                        game.SetID(requests[i].created_game_id);

                                        game.Pull(function(success)
                                        {
                                            if (success)
                                            {
                                                // we are ready to play
                                                readyGameResponse(game.GetPublicData(), player, res);
                                            }
                                            else
                                            {
                                                // create new game request
                                                createGameRequest(player.GetID(), requestedTopicID, res);
                                            }
                                        });

                                        // set flag to false
                                        createNewRequest = false;

                                        // break for cycle
                                        break;
                                    }
                                    else
                                    {
                                        // if game is not created yet
                                        // wait for an opponent

                                        // set flag to false
                                        createNewRequest = false;

                                        // update "last_update" time and send a response
                                        DB.collection('game_requests').update(
                                        {
                                            _id: requests[i]._id
                                        },
                                        {
                                            $set:
                                            {
                                                last_update: utils.GetTimestamp()
                                            }
                                        }, function(err)
                                        {
                                            if (err)
                                                throw err;

                                            var response = utils.GetEmptyResponse();

                                            // response with "searrching" status
                                            response.status = "searching";

                                            res.send(response);
                                        });

                                        // break for cycle
                                        break;
                                    }
                                }
                                else
                                {
                                    // if a request is not mine

                                    // create game with this player
                                    // if game is not created yet
                                    if (!requests[i].created_game_id)
                                    {
                                        // create a new game
                                        var game = new Game();

                                        game.SetTopicByID(requestedTopicID, function(success)
                                        {
                                            if (success)
                                            {
                                                game.GenerateQuestions(function(success)
                                                {
                                                    if (success)
                                                    {
                                                        game.AddPlayer(player.GetID());
                                                        game.AddPlayer(requests[i].player_id);

                                                        game.Push(function()
                                                        {
                                                            // update request object in game_requestes collection
                                                            DB.collection('game_requests').update(
                                                            {
                                                                _id: requests[i]._id
                                                            },
                                                            {
                                                                $set:
                                                                {
                                                                    created_game_id: game.GetID()
                                                                }
                                                            }, function(err)
                                                            {
                                                                if (err)
                                                                    throw err;

                                                                // we are ready to play
                                                                readyGameResponse(game.GetPublicData(), player, res);

                                                            });
                                                        });
                                                    }
                                                    else
                                                    {
                                                        // there is no questions in data base
                                                        errorResponse(res, 11);
                                                    }
                                                });
                                            }
                                            else
                                            {
                                                // there is no topic in data base
                                                errorResponse(res, 10);
                                            }
                                        });

                                        // set flag to false
                                        createNewRequest = false;

                                        // break for cycle
                                        break;
                                    }
                                }
                            }

                            // if flag is still true
                            if (createNewRequest)
                            {
                                // create a new request
                                createGameRequest(player.GetID(), requestedTopicID, res);
                            }

                        }
                        else
                        {
                            // create a new game request
                            createGameRequest(player.GetID(), requestedTopicID, res);
                        }
                    });
                }
                else
                {
                    errorResponse(res, 1);
                }
            });
        }
    });

    console.log("GameInitialization module is initialized.");
}
