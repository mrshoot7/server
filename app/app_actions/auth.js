var utils = require(__base + 'utils');
var Security = require(__base + 'app/security/security').Security;
var errorResponse = require(__base + 'errors').response;
var Player = require(__base + 'app/schemes/Player').Player;

exports.Initialize = function(app)
{
    // sign in method
    app.post('/signin', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            // get user data from a request body
            var requestedUserName = req.body.username;
            var requestedPasswordHash = req.body.password_hash;

            var player = new Player();

            player.SignIn(requestedUserName, requestedPasswordHash, function(success, errorCode)
            {
                if (success)
                {
                    // generate new access token
                    var token = player.GenerateNewToken();

                    // push an updated array with tokens into the players collection
                    player.Push(function()
                    {
                        // generate an empty response
                        var response = utils.GetEmptyResponse();

                        // add the new token
                        response.token = token;

                        // send a response
                        res.send(response);
                    });
                }
                else
                {
                    // send an error if we've not found a player with the requested data
                    errorResponse(res, errorCode);
                }
            });
        }
    });

    // sign up method
    app.post('/signup', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            // get user data from a request body
            var username = req.body.username;
            var passwordHash = req.body.password_hash;
            var email = req.body.email;

            // make a request to get a player with an username as we just got from the request to check if user already exist
            DB.collection('players').findOne(
            {
                username: username
            }, function(err, existedPlayer)
            {
                if (err)
                    throw err;

                // if there is a player with the same user name
                if (existedPlayer)
                {
                    // send an error
                    errorResponse(res, 3);
                }
                else
                {
                    // generate empty user object
                    var player = new Player();

                    // generate token which user will use to request a server
                    var token = player.GenerateNewToken();

                    // fill user object fields
                    player.SetUsername(username);
                    player.SetPasswordHash(passwordHash);
                    player.SetEmail(email);

                    player.Push(function()
                    {
                        // generate an empty response
                        var response = utils.GetEmptyResponse();

                        // add the new token
                        response.token = token;

                        // send a response
                        res.send(response);
                    });
                }
            });
        }
    });

    // facebook connect method
    app.post('/facebook-connect', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            // get user data from a request body
            var fbID = req.body.fbID;
            var email = req.body.email;

            // set a part of email as username
            var username = email.split("@")[0];

            var player = new Player();

            player.SignInWithFacebook(fbID, function(success)
            {
                // if a player already exists
                if (success)
                {
                    // generate token which user will use to request a server
                    var token = player.GenerateNewToken();

                    player.Push(function()
                    {
                        // generate an empty response
                        var response = utils.GetEmptyResponse();

                        // add the new token
                        response.token = token;

                        // send a response
                        res.send(response);
                    });
                }
                else
                {
                    // create a new player if player with requested fbID does not exist 

                    // fill player object fields
                    player.SetFacebookID(fbID);
                    player.SetUsername(username);
                    player.SetEmail(email);

                    player.Push(function()
                    {
                        // generate an empty response
                        var response = utils.GetEmptyResponse();

                        // add the new token
                        response.token = token;

                        // send a response
                        res.send(response);
                    });
                }
            });
        }
    });

    console.log("Auth module is initialized.");
}
