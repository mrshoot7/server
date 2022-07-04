var utils = require(__base + 'utils');
var Security = require(__base + 'app/security/security').Security;
var Topic = require(__base + 'app/schemes/Topic').Topic;
var AppSettings = require(__base + "app/schemes/AppSettings").AppSettings;

exports.Initialize = function(app)
{
    // returns a general data
    app.post('/get-general-data', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            // get all topics from the topics collection
            DB.collection("topics").find().toArray(function(err, topics)
            {
                if (err)
                    throw err;

                // array with public data about topics
                var topicsPublic = [];

                // parse each topic object from database to Topic object
                for (var i = 0; i < topics.length; i++)
                {
                    var topic = new Topic();

                    topic.SetDocument(topics[i]);

                    // get public data
                    topicsPublic.push(topic.GetPublicData())
                }

                // generate an empty response
                var response = utils.GetEmptyResponse();

                // add data to the response
                response.data = {
                    topics: topicsPublic
                };

                var appSettings = new AppSettings();

                appSettings.Pull(function()
                {
                    response.data.settings = appSettings.GetPublicData();
                    res.send(response);
                });
            });
        }
    });

    // returns a questions count by topic id
    app.post('/get-questions-count-by-topic', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            // create a Topic instance
            var topic = new Topic();

            // Set id
            topic.SetID(req.body.topic);

            topic.GetQuestionsCount(function(count)
            {
                var response = utils.GetEmptyResponse();

                response.questionsNumber = count;
                response.topicID = topic.GetID();

                res.send(response);
            });
        }
    });

    // returns a leaderboard
    app.post('/get-leaderboard-by-topic', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            var topic = new Topic();

            topic.SetID(req.body.topic);

            topic.GetLeaderboard(function(leaderboard)
            {
                var response = utils.GetEmptyResponse();

                response.leaderboard = leaderboard;
                response.topic = parseInt(topic.GetID());

                res.send(response);
            });
        }
    });

    // returns a leaderboard
    app.post('/get-app-settings', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            var appSettings = new AppSettings();

            appSettings.Pull(function()
            {
                var response = utils.GetEmptyResponse();

                response.settings = appSettings.GetPublicData();

                res.send(response);
            });
        }
    });

    console.log("AppData module is initialized.");
}
