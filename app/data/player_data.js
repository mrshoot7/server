var utils = require(__base + 'utils');
var Player = require(__base + 'app/schemes/Player').Player;
var Security = require(__base + 'app/security/security').Security;

exports.Initialize = function(app)
{
    // returns an info about player profile
    app.post('/get-user-profile', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            var player = new Player();

            player.PullByToken(req.body.token, function()
            {
                if (player.IsInstantiated)
                {
                    // generate an empty response
                    var response = utils.GetEmptyResponse();

                    // fill a data
                    response.userProfile = player.GetPublicData();

                    // send a response
                    res.send(response);
                }
                else
                {
                    errorResponse(res, 1);
                }
            });
        }
    });

    // returns a place in topic
    app.post('/get-place-in-topic', function(req, res)
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
                    player.GetPlaceInTopic(req.body.topic, function(place)
                    {
                        var response = utils.GetEmptyResponse();

                        response.place = place;
                        response.topicID = req.body.topic;

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

    console.log("PlayerData module is initialized.");
}
