var utils = require(__base + 'utils');
var checkAPIKey = utils.CheckAPIKey;
var errorResponse = require(__base + 'errors').response;
var Player = require(__base + 'app/schemes/Player').Player;
var Security = require(__base + 'app/security/security').Security;

exports.Initialize = function(app)
{
    // this method updates a topics list of a player
    app.post('/follow-topics', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            // find a player by a token from a request
            var player = new Player();

            player.PullByToken(req.body.token, function()
            {
                if (player.IsInstantiated)
                {
                    // parse strings array to ints array
                    var parsedTopics = req.body.ids.split(",").map(function(item)
                    {
                        return parseInt(item, 10);
                    });

                    player.FollowTopics(parsedTopics, function()
                    {
                        // generate an empty response
                        var response = utils.GetEmptyResponse();

                        // fill a data
                        response.topics = player.GetPublicData().topics;

                        // send a response
                        res.send(response);
                    });
                }
                else
                {
                    errorResponse(res, 1);
                }
            });
        }
    });

    // this method updates a topics list of a player
    app.post('/unfollow-topics', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            // find a player by a token from a request
            var player = new Player();

            player.PullByToken(req.body.token, function()
            {
                if (player.IsInstantiated)
                {
                    // parse strings array to ints array
                    var parsedTopics = req.body.ids.split(",").map(function(item)
                    {
                        return parseInt(item, 10);
                    });

                    player.UnfollowTopics(parsedTopics, function()
                    {
                        // generate an empty response
                        var response = utils.GetEmptyResponse();

                        // fill a data
                        response.topics = player.GetPublicData().topics;

                        // send a response
                        res.send(response);
                    });
                }
                else
                {
                    errorResponse(res, 1);
                }
            });
        }
    });

    console.log("TopicActions module is initialized.");
}
