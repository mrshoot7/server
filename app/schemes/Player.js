var utils = require(__base + "utils");
var Topic = require(__base + "app/schemes/Topic").Topic;
var AppSettings = require(__base + "app/schemes/AppSettings").AppSettings;

exports.Player = function()
{
    var In = this; // instance

    this.Document = {
        id: utils.GenerateID(),
        username: "",
        password_hash: "",
        email: "",
        tokens: [],
        fbID: "",
        topics: [],
        correctAnswers: 0,
        level: 1
    }

    this.IsInstantiated = false;

    // Setters
    this.SetID = function(id)
    {
        In.Document.id = id;
    }

    this.SetUsername = function(username)
    {
        In.Document.username = username;
    }

    this.SetPasswordHash = function(password_hash)
    {
        In.Document.password_hash = password_hash;
    }

    this.SetEmail = function(email)
    {
        In.Document.email = email;
    }

    this.SetFacebookID = function(facebookID)
    {
        In.Document.fbID = facebookID;
    }

    // Getters
    this.GetID = function()
    {
        return In.Document.id;
    }

    this.GenerateNewToken = function()
    {
        // generate token which user will use to request a server
        var token = utils.GenerateToken();

        // valid tokens are stored in the 'tokens' array in the 'players' collection
        // keep only 10 tokens for each player
        if (In.Document.tokens.length >= 10)
        {
            In.Document.tokens.splice(0, In.Document.tokens.length - 9);
        }

        In.Document.tokens.push(token);

        return token;
    }

    this.GetPublicData = function()
    {
        return {
            id: In.Document.id,
            username: In.Document.username,
            topics: In.Document.topics,
            correctAnswers: In.Document.correctAnswers,
            level: In.Document.level,
            fbID: In.Document.fbID
        };
    }

    this.Push = function(callback)
    {
        DB.collection('players').findOne(
        {
            id: In.Document.id
        }, function(err, existed)
        {
            if (err)
                throw err;

            if (existed)
            {
                DB.collection('players').update(
                    {
                        id: In.Document.id
                    },
                    In.Document,
                    function(err)
                    {
                        if (err)
                            throw err;

                        callback();
                    }
                );
            }
            else
            {
                DB.collection('players').insert(
                    In.Document,
                    function(err)
                    {
                        if (err)
                            throw err;

                        callback();
                    }
                );
            }
        });
    }

    this.Pull = function(callback)
    {
        DB.collection('players').findOne(
        {
            id: In.Document.id
        }, function(err, result)
        {
            if (err)
                throw err;

            if (result)
            {
                In.Document = result;

                In.IsInstantiated = true;

                callback(true, In);
            }
            else
            {
                callback(false, In);
            }
        });
    }

    this.SignIn = function(username, password_hash, callback)
    {
        DB.collection('players').findOne(
        {
            username: username,
            password_hash: password_hash
        }, function(err, existedPlayer)
        {
            // throw an error if it is not null
            if (err)
                throw err;

            // continue if we found a player with requested data
            if (existedPlayer)
            {
                In.Document = existedPlayer;

                callback(true);
            }
            else
            {
                callback(false, 2);
            }
        });
    }

    this.SignInWithFacebook = function(facebookID, callback)
    {
        // make a request to get a player with a facebookID as we just got from the request
        DB.collection('players').findOne(
        {
            fbID: facebookID
        }, function(err, existedPlayer)
        {
            if (err)
                throw err;

            if (existedPlayer)
            {
                In.Document = existedPlayer;

                callback(true);
            }
            else
            {
                callback(false);
            }
        });
    }

    this.PullByToken = function(token, callback)
    {
        // find a player by a token
        DB.collection('players').findOne(
        {
            tokens: token
        }, function(err, player)
        {
            if (err)
                throw err;

            if (player)
            {
                In.Document = player;
                In.IsInstantiated = true;
            }

            callback();
        });
    }

    this.GetPlaceInTopic = function(topicID, callback)
    {
        DB.collection('leaderboard').find(
        {
            "topic": parseInt(topicID)
        },
        {
            "sort": [
                [
                    "score", "descending"
                ]
            ]
        }).toArray(function(err, result)
        {
            if (err)
                throw err;

            var place = result.map(function(e)
            {
                return e.player;
            }).indexOf(In.Document.id);

            if (place < 0)
            {
                place = "-";
            }
            else
            {
                place++;
            }

            callback(place);
        });
    }

    this.FollowTopics = function(topics, callback)
    {
        // merge new topics and already chosen topics
        var playerTopicsCopy = In.Document.topics.slice();
        var addedTopics = [];

        for (var i = 0; i < topics.length; i++)
        {
            if (playerTopicsCopy.indexOf(topics[i]) == -1)
            {
                addedTopics.push(topics[i]);
                playerTopicsCopy.push(topics[i]);
            }
        }

        if (playerTopicsCopy.length != In.Document.topics.length)
        {
            // update players collection
            DB.collection('players').update(
            {
                id: In.Document.id
            },
            {
                $set:
                {
                    topics: playerTopicsCopy
                }
            }, function(err)
            {
                if (err)
                    throw err;

                Topic.UpdateFollowersNumber(addedTopics, 1, function(err)
                {
                    if (err)
                        throw err;

                    finish();
                });
            });
        }
        else
        {
            finish();
        }

        function finish()
        {
            In.Pull(function()
            {
                callback();
            });
        }
    }

    this.UnfollowTopics = function(topicsToRemoving, callback)
    {
        var appSettings = new AppSettings();

        appSettings.Pull(function(success)
        {
            if (success)
            {
                // copy the topics array
                var playerTopicsCopy = In.Document.topics.slice();

                var removedTopics = [];

                // remove each topic from player object
                for (var i = 0; i < topicsToRemoving.length; i++)
                {
                    if (playerTopicsCopy.length > appSettings.GetNumberOfTopics())
                    {
                        playerTopicsCopy.remove(topicsToRemoving[i]);
                        removedTopics.push(topicsToRemoving[i]);
                    }
                }

                if (playerTopicsCopy.length != In.Document.topics.length)
                {
                    // update players collection
                    DB.collection('players').update(
                    {
                        id: In.Document.id
                    },
                    {
                        $set:
                        {
                            topics: playerTopicsCopy
                        }
                    }, function(err)
                    {
                        if (err)
                            throw err;

                        Topic.UpdateFollowersNumber(removedTopics, -1, function(err)
                        {
                            if (err)
                                throw err;

                            finish();
                        });
                    });
                }
                else
                {
                    finish();
                }
            }
            else
            {
                throw new Error("There is no game settings in the database");
            }
        });

        function finish()
        {
            In.Pull(function()
            {
                callback();
            });
        }
    }

    this.AddCorrectAnswer = function(callback)
    {
        In.Pull(function(success)
        {
            if (success)
            {
                // add correct answer
                In.Document.correctAnswers++;

                // update level
                In.Document.level = parseInt(In.Document.correctAnswers / 10) + 1;

                In.Push(function()
                {
                    callback(true);
                });
            }
            else
            {
                callback(false);
            }
        });
    }

    this.AddPointToLeaderboard = function(topicID, callback)
    {
        DB.collection('leaderboard').findOne(
        {
            player: In.Document.id,
            topic: topicID
        }, function(err, leaderboardResult)
        {
            if (err)
                throw err;

            if (leaderboardResult)
            {
                DB.collection('leaderboard').update(
                {
                    player: In.Document.id,
                    topic: topicID
                },
                {
                    $inc:
                    {
                        score: 1
                    }
                }, function(err)
                {
                    if (err)
                        throw err;

                    callback();
                });
            }
            else
            {
                DB.collection('leaderboard').insert(
                {
                    player: In.Document.id,
                    topic: topicID,
                    score: 1
                }, function(err)
                {
                    if (err)
                        throw err;

                    callback();
                });
            }
        });
    }
}
