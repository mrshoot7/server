var utils = require('./utils');
var AppSettings = require(__base + "app/schemes/AppSettings").AppSettings;
var Security = require(__base + 'app/security/security').Security;

exports.Initialize = function(app)
{
    console.log("\n===== Admin module initialization is started");

    function errorResponse(res, id)
    {
        var errors = {
            1001: 'ADMIN_API_KEY_IS_NOT_VALID',
            1002: 'WRONG_INPUT_DATA',
            1003: 'TOPIC_IS_NOT_FOUND',
            1004: 'QUESTION_IS_NOT_FOUND'
        };

        // send an error if we've not found a player with the requested data
        res.send(
        {
            Error:
            {
                id: id,
                message: errors[id]
            }
        });
    }

    // validate a question before addition to a data base
    function validateQuestion(body)
    {
        // return false if there are no question text and image
        if (body.body.length == 0 && body.imageUrl.length == 0)
            return false;

        // parse answers texts and images
        var aTexts = body.answersTexts.split(",");
        var aImages = body.answersImages.split(",");

        // if there are no 4 answers
        if (aTexts.length != 4) return false;
        if (aImages.length != 4) return false;

        for (var i = 0; i < 4; i++)
        // return false if there is an empty answer
            if (aTexts[i].length == 0 && aImages[i].length == 0)
                return false;

            // return true if everything is okay
        return true;
    }

    // sign in method
    app.post('/check-connection', function(req, res)
    {
        // success response
        res.send(
        {
            statusStr: true
        });
    });

    // method to add a new topic
    app.post('/add-topic', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            // if there are a title and an image
            if (req.body.title.length > 0 && req.body.imageUrl.length > 0)
            {
                // fine topic with max id
                DB.collection("topics").find().sort(
                {
                    id: -1
                }).limit(1).toArray(function(err, maxTopic)
                {
                    if (err)
                        throw err;

                    // calculate next id for a new topic
                    var nextID = 1;
                    if (maxTopic.length > 0)
                        nextID = maxTopic[0].id + 1;

                    // insert new topic in the topics collection
                    DB.collection("topics").insert(
                    {
                        id: nextID,
                        name: req.body.title,
                        imageUrl: req.body.imageUrl,
                        followersNumber: 0
                    }, function(err)
                    {
                        if (err)
                            throw err;

                        // success response
                        res.send(
                        {
                            successStr: true
                        });

                    });
                });
            }
            else
            {
                errorResponse(res, 1002);
            }
        }
    });

    app.post('/add-question', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            // if question is okay
            if (validateQuestion(req.body))
            {
                // find a question with max id
                DB.collection("questions").find().sort(
                {
                    id: -1
                }).limit(1).toArray(function(err, maxQuestion)
                {
                    if (err)
                        throw err;

                    // calc next question id
                    var nextID = 1;
                    if (maxQuestion.length > 0)
                        nextID = maxQuestion[0].id + 1;

                    // parse answers from a request body
                    var answers = [];
                    var answersTexts = req.body.answersTexts.split(",");
                    var answersImages = req.body.answersImages.split(",");

                    for (var i = 0; i < answersTexts.length || i < answersImages.length; i++)
                    {
                        var a = {
                            id: i
                        };

                        if (answersTexts.length > i)
                            a.body = answersTexts[i];

                        if (answersImages.length > i)
                            a.imageUrl = answersImages[i];

                        answers.push(a);
                    }

                    // find a topic with an id from a new question
                    DB.collection("topics").findOne(
                    {
                        id: parseInt(req.body.topicId)
                    }, function(err, topic)
                    {
                        if (err)
                            throw err;

                        // if topic with a requested id exists
                        if (topic)
                        {
                            // insert a new question to the questions collection
                            DB.collection("questions").insert(
                            {
                                id: nextID,
                                body: req.body.body,
                                imageUrl: req.body.imageUrl,
                                topicId: topic.id,
                                answers: answers,
                                correctAnswer: req.body.correctAnswer
                            }, function(err, result)
                            {
                                res.send(
                                {
                                    successStr: true
                                });
                            });
                        }
                        else
                        {
                            errorResponse(res, 1002);
                        }
                    });
                });
            }
            else
            {
                errorResponse(res, 1002);
            }
        }
    });

    app.post('/edit-question', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            // if question is okay
            if (validateQuestion(req.body))
            {
                // find a question with a requested id
                DB.collection("questions").findOne(
                {
                    id: parseInt(req.body.questionId)
                }, function(err, question)
                {
                    if (err)
                        throw err;

                    // if question exists
                    if (question)
                    {
                        // parse answers
                        var answers = [];
                        var answersTexts = req.body.answersTexts.split(",");
                        var answersImages = req.body.answersImages.split(",");

                        for (var i = 0; i < answersTexts.length || i < answersImages.length; i++)
                        {
                            var a = {
                                id: i
                            };

                            if (answersTexts.length > i)
                                a.body = answersTexts[i];

                            if (answersImages.length > i)
                                a.imageUrl = answersImages[i];

                            answers.push(a);
                        }

                        // find a topic with a requsted id
                        DB.collection("topics").findOne(
                        {
                            id: parseInt(req.body.topicId)
                        }, function(err, topic)
                        {
                            if (err)
                                throw err;

                            // if topic exists
                            if (topic)
                            {
                                // update the questions collection
                                DB.collection("questions").update(
                                {
                                    id: parseInt(question.id)
                                },
                                {
                                    $set:
                                    {
                                        body: req.body.body,
                                        imageUrl: req.body.imageUrl,
                                        topicId: topic.id,
                                        answers: answers,
                                        correctAnswer: req.body.correctAnswer
                                    }
                                }, function(err)
                                {
                                    if (err)
                                        throw err;

                                    // send a success status
                                    res.send(
                                    {
                                        successStr: true
                                    });

                                });
                            }
                            else
                            {
                                errorResponse(res, 1003);
                            }
                        });
                    }
                    else
                    {
                        errorResponse(res, 1004);
                    }
                });
            }
            else
            {
                errorResponse(res, 1002);
            }
        }
    });

    app.post('/remove-question', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            // remove question with a requested id
            DB.collection("questions").remove(
            {
                id: parseInt(req.body.questionId)
            }, function(err)
            {
                if (err)
                    throw err;

                // send a success status
                res.send(
                {
                    removedItemId: req.body.questionId,
                    successStr: true
                });
            });
        }
    });

    app.post('/get-questions-list', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            // get all questions from the questions collection
            DB.collection("questions").find().toArray(function(err, questions)
            {
                if (err)
                    throw err;

                // generate an empty response
                var response = utils.GetEmptyResponse();

                // add questions
                response.questions = questions;

                // send a response
                res.send(response);
            });
        }
        else
        {
            errorResponse(res, 1002);
        }
    });

    app.post('/edit-topic', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            // find a topic with a requested id
            DB.collection("topics").findOne(
            {
                id: parseInt(req.body.topicId)
            }, function(err, topic)
            {
                if (err)
                    throw err;

                // if a topic exists
                if (topic)
                {
                    // update a topics collection
                    DB.collection("topics").update(
                    {
                        id: parseInt(topic.id)
                    },
                    {
                        $set:
                        {
                            name: req.body.name,
                            imageUrl: req.body.imageUrl
                        }
                    }, function(err)
                    {
                        if (err)
                            throw err;

                        // send a success status
                        res.send(
                        {
                            successStr: true
                        });
                    });
                }
                else
                {
                    errorResponse(res, 1003);
                }
            });
        }
    });

    app.post('/remove-topic', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            // remove a topic with a requested id
            DB.collection("topics").remove(
            {
                id: parseInt(req.body.topicId)
            }, function(err)
            {
                if (err)
                    throw err;

                // send a success status
                res.send(
                {
                    removedItemId: req.body.topicId,
                    successStr: true
                });
            });
        }
    });

    // returns a leaderboard
    app.post('/set-game-settings', function(req, res)
    {
        // if request is secure
        if (Security.RequestIsValid(req, res))
        {
            var appSettings = new AppSettings();

            appSettings.Pull(function()
            {
                appSettings.SetNumberOfTopics(parseInt(req.body.requiredNumberOfTopics));
                appSettings.SetNumberOfQuestionsInGame(parseInt(req.body.numberOfQuestionsInGame));

                appSettings.Push(function()
                {
                    // send a success status
                    res.send(
                    {
                        successStr: true
                    });
                });
            });
        }
    });

    console.log("===== Admin module is initialized\n");
};
