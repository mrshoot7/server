var utils = require(__base + 'utils');
var errorResponse = require(__base + 'errors').response;
var Player = require(__base + 'app/schemes/Player').Player;
var Game = require(__base + 'app/schemes/Game').Game;
var Security = require(__base + 'app/security/security').Security;

exports.Initialize = function(app)
{
    // wait for another player
    app.post('/wait-for-another-player', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            var requestedPlayerToken = req.body.token;
            var requestedGameID = req.body.game_id;

            // find a player by a token from a request
            var player = new Player();

            player.PullByToken(requestedPlayerToken, function()
            {
                if (player.IsInstantiated)
                {
                    var game = new Game();

                    game.SetID(requestedGameID);

                    game.Pull(function(success)
                    {
                        if (success)
                        {
                            game.SetPlayerIsReady(player.GetID(), function(success)
                            {
                                if (success)
                                {
                                    // generate an empty response
                                    var response = utils.GetEmptyResponse();

                                    // fill a data
                                    response.readyString = game.AreResourcesReady();

                                    // send a response
                                    res.send(response);
                                }
                                else
                                {
                                    errorResponse(res, 5);
                                }
                            });
                        }
                        else
                        {
                            errorResponse(res, 6);
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

    app.post('/answer', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            var requestedPlayerToken = req.body.token;
            var requestedGameID = req.body.game_id;
            var requestedQuestionID = req.body.question_id;
            var requestedAnswerID = req.body.answer_id;

            // success response
            function successResponse()
            {
                res.send(
                {
                    successString: true
                });
            }

            // find a player by a token from a request
            var player = new Player();

            player.PullByToken(requestedPlayerToken, function()
            {
                if (player.IsInstantiated)
                {
                    var game = new Game();

                    game.SetID(requestedGameID);

                    game.Pull(function(success)
                    {
                        if (success)
                        {
                            if (game.IsPlayerInTheGame(player.GetID()))
                            {
                                var question = game.GetQuestionByID(requestedQuestionID);

                                if (question != undefined)
                                {
                                    // if question is not already answered
                                    if (!game.IsQuestionAnswered(question.id, player.GetID()))
                                    {
                                        game.Answer(question.id, requestedAnswerID, player.GetID(), function(isAnswerCorrect)
                                        {
                                            if (isAnswerCorrect)
                                            {
                                                player.AddCorrectAnswer(function()
                                                {
                                                    // answer is added
                                                });
                                            }

                                            if (game.IsFinished())
                                            {
                                                var winner = game.GetWinner();

                                                // update leaderboard
                                                // if not a draw
                                                if (winner != undefined)
                                                {
                                                    // get game topic
                                                    var topic = game.GetTopic();

                                                    // create player object for a winner
                                                    var winnerPlayer = new Player();

                                                    // set an id
                                                    winnerPlayer.SetID(winner.id);

                                                    // update leaderboard
                                                    winnerPlayer.AddPointToLeaderboard(topic.id, function()
                                                    {
                                                        successResponse();
                                                    });
                                                }
                                                else
                                                {
                                                    successResponse();
                                                }
                                            }
                                            else
                                            {
                                                successResponse();
                                            }
                                        });
                                    }
                                    else
                                    {
                                        successResponse();
                                    }
                                }
                                else
                                {
                                    errorResponse(res, 8);
                                }
                            }
                            else
                            {
                                errorResponse(res, 5);
                            }
                        }
                        else
                        {
                            errorResponse(res, 6);
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

    app.post('/skip-question', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            var requestedPlayerToken = req.body.token;
            var requestedGameID = req.body.game_id;
            var requestedQuestionID = req.body.question_id;

            // success response
            function successResponse()
            {
                res.send(
                {
                    successString: true
                });
            }


            // find a player by a token from a request
            var player = new Player();

            player.PullByToken(requestedPlayerToken, function()
            {
                if (player.IsInstantiated)
                {
                    var game = new Game();

                    game.SetID(requestedGameID);

                    game.Pull(function(success)
                    {
                        if (success)
                        {
                            if (game.IsPlayerInTheGame(player.GetID()))
                            {
                                var question = game.GetQuestionByID(requestedQuestionID);

                                if (question != undefined)
                                {
                                    // if question is not already answered
                                    if (!game.IsQuestionAnswered(question.id, player.GetID()))
                                    {
                                        game.SkipQuestion(question.id, player.GetID(), function()
                                        {
                                            if (game.IsFinished())
                                            {
                                                var winner = game.GetWinner();

                                                // update leaderboard
                                                // if not a draw
                                                if (winner != undefined)
                                                {
                                                    // get game topic
                                                    var topic = game.GetTopic();

                                                    // create player object for a winner
                                                    var winnerPlayer = new Player();

                                                    // set an id
                                                    winnerPlayer.SetID(winner.id);

                                                    // update leaderboard
                                                    winnerPlayer.AddPointToLeaderboard(topic.id, function()
                                                    {
                                                        successResponse();
                                                    });
                                                }
                                                else
                                                {
                                                    successResponse();
                                                }
                                            }
                                            else
                                            {
                                                successResponse();
                                            }
                                        });
                                    }
                                    else
                                    {
                                        successResponse();
                                    }
                                }
                                else
                                {
                                    errorResponse(res, 8);
                                }
                            }
                            else
                            {
                                errorResponse(res, 5);
                            }
                        }
                        else
                        {
                            errorResponse(res, 6);
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

    app.post('/wait-both-players', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            var requestedPlayerToken = req.body.token;
            var requestedGameID = req.body.game_id;

            // find a player by a token from a request
            var player = new Player();

            player.PullByToken(requestedPlayerToken, function()
            {
                if (player.IsInstantiated)
                {
                    var game = new Game();

                    game.SetID(requestedGameID);

                    game.Pull(function(success)
                    {
                        if (success)
                        {
                            var gameData = game.GetPublicData();

                            var opponentID = gameData.player1.id == player.GetID() ? gameData.player2.id : gameData.player1.id;

                            // if both players ansreded an equal number of questions
                            var areReady = game.AreBothPlayersReadyForNextQuestion();

                            if (areReady)
                            {
                                var playerOpponent = new Player();

                                playerOpponent.SetID(opponentID);

                                playerOpponent.Pull(function(success)
                                {
                                    if (success)
                                    {
                                        var me = {
                                            playerObject: player.GetPublicData()
                                        };
                                        var opponent = {
                                            playerObject: playerOpponent.GetPublicData()
                                        };

                                        if (player.GetID() == gameData.player1.id)
                                        {
                                            me.gameInfo = gameData.player1;
                                            opponent.gameInfo = gameData.player2;
                                        }
                                        else
                                        {
                                            me.gameInfo = gameData.player2;
                                            opponent.gameInfo = gameData.player1;
                                        }

                                        res.send(
                                        {
                                            info:
                                            {
                                                readyString: true,
                                                me: me,
                                                opponent: opponent
                                            }
                                        });
                                    }
                                    else
                                    {
                                        errorResponse(res, 9);
                                    }
                                });
                            }
                            else
                            {
                                // if there is no answer from the opponent for a long time
                                if (game.GetTimeFromTheLastAction() > 10000)
                                {
                                    var me = game.GetPlayerObjectByID(player.GetID());

                                    var lastAnswer = me.answers[me.answers.length - 1];

                                    game.SkipQuestion(lastAnswer.question_id, opponentID, function()
                                    {
                                        //
                                    });
                                }

                                res.send(
                                {
                                    info:
                                    {
                                        readyString: false
                                    }
                                });
                            }
                        }
                        else
                        {
                            errorResponse(res, 6);
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

    console.log("GameActions module is initialized.");
}
