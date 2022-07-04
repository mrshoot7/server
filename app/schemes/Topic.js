exports.Topic = function()
{
    var utils = require(__base + "utils");
    var Player = require(__base + 'app/schemes/Player').Player;

    var In = this; // instance

    this.Document = {
        id: utils.GenerateID(),
        imageUrl: "",
        name: "",
        followersNumber: "",
    }

    this.IsInstantiated = false;

    this.SetDocument = function(document)
    {
        In.Document = document;
    }

    this.SetID = function(id)
    {
        In.Document.id = id;
    }

    this.GetID = function()
    {
        return In.Document.id;
    }

    this.GetPublicData = function()
    {
        return {
            id: In.Document.id,
            imageUrl: In.Document.imageUrl,
            name: In.Document.name,
            followersNumber: In.Document.followersNumber,
        };
    }

    this.Push = function(callback)
    {
        DB.collection('topics').findOne(
        {
            id: In.Document.id
        }, function(err, existed)
        {
            if (err)
                throw err;

            if (existed)
            {
                DB.collection('topics').update(
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
                DB.collection('topics').insert(
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
        DB.collection('topics').findOne(
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

    this.GetQuestionsCount = function(callback)
    {
        DB.collection('questions').find(
        {
            topicId: parseInt(In.Document.id)
        }).toArray(function(err, questions)
        {
            if (err)
                throw err;

            callback(questions.length);
        });
    }

    this.GetLeaderboard = function(callback)
    {
        DB.collection('leaderboard').find(
        {
            "topic": parseInt(In.Document.id)
        },
        {
            "sort": [
                [
                    "score", "descending"
                ],
            ],
            "limit": 10
        }).toArray(function(err, result)
        {
            if (err)
                throw err;

            // check if we load data about each player
            var completedPlayers = [];

            function checkComplete(player)
            {
                var complete = true;

                if (player != undefined)
                {
                    completedPlayers.push(player.GetID());

                    for (var i = 0; i < result.length; i++)
                    {
                        if (result[i].player == player.GetID())
                        {
                            result[i].playerObject = player.GetPublicData();
                        }

                        if (completedPlayers.indexOf(result[i].player) == -1)
                        {
                            complete = false;
                        }
                    }
                }

                if (complete)
                {
                    callback(result);
                }
            }

            if (result.length == 0)
            {
                checkComplete();
            }

            for (var i = 0; i < result.length; i++)
            {
                var player = new Player();

                player.SetID(result[i].player);

                player.Pull(function(success, updatedInstance)
                {
                    checkComplete(updatedInstance);
                });
            }
        });
    }
}

exports.Topic.UpdateFollowersNumber = function(topics, number, callback)
{
    // create a query to update followers number
    var updateQuery = {
        $or: []
    };

    for (var i = 0; i < topics.length; i++)
    {
        // add it to update query
        updateQuery['$or'].push(
        {
            id: topics[i]
        });
    }

    DB.collection('topics').update(
        updateQuery,
        {
            $inc:
            {
                followersNumber: number
            }
        },
        {
            multi: true
        },
        function(err)
        {
            if (err)
                throw err;

            callback();
        }
    );
}
