var utils = require(__base + "utils");
var AppSettings = require(__base + "app/schemes/AppSettings").AppSettings;

exports.Game = function()
{
    var In = this; // instance

    this.Document = {
        id: utils.GenerateID(),
        questions: [],
        topic: undefined,
        player1: undefined,
        player2: undefined,
        timeOfLastAction: 0
    }

    this.IsInstantiated = false;

    // Setters
    this.SetID = function(id)
    {
        In.Document.id = id;
    }

    this.SetTopicByID = function(topicID, callback)
    {
        // find a game by an id from a request
        DB.collection('topics').findOne(
        {
            id: parseInt(topicID)
        }, function(err, topic)
        {
            if (err)
                throw err;

            if (topic)
            {
                In.Document.topic = topic;

                callback(true);
            }
            else
            {
                callback(false);
            }
        });
    }

    this.GetTimeFromTheLastAction = function()
    {
        return Date.now() - In.Document.timeOfLastAction;
    }

    this.GenerateQuestions = function(callback)
    {
        if (In.Document.topic != undefined)
        {
            var appSettings = new AppSettings();

            appSettings.Pull(function(success)
            {
                if (success)
                {
                    // make a request to find all questions by topic in questions collection
                    DB.collection('questions').find(
                    {
                        topicId: In.Document.topic.id
                    }).toArray(function(err, allQuestionsByTopic)
                    {
                        if (err)
                            throw err;

                        // create an array for random questions
                        var questions = [];

                        // function to know if question is already in pool
                        function isQuestionUnique(q, arr)
                        {
                            for (var i = 0; i < arr.length; i++)
                            {
                                if (q.id == arr[i].id) return false;
                            }

                            return true;
                        };

                        // while questions number is less than N and less than all questions number
                        while (questions.length < appSettings.GetNumberOfQuestionsInGame() && questions.length < allQuestionsByTopic.length)
                        {
                            // get random question index
                            var randomIndex = utils.RandomIntInRange(0, allQuestionsByTopic.length - 1);

                            // if it is not in questions pool yet
                            if (isQuestionUnique(allQuestionsByTopic[randomIndex], questions))
                            // add it in the pool
                                questions.push(allQuestionsByTopic[randomIndex]);
                        }

                        // set questions
                        In.Document.questions = questions;

                        // push to the database
                        In.Push(function()
                        {
                            if (questions.length > 0)
                            {
                                // call a callback
                                callback(true);
                            }
                            else
                            {
                                // call a callback
                                callback(false);
                            }
                        });
                    });
                }
            });
        }
    }

    this.AddPlayer = function(playerID)
    {
        var player = {
            id: playerID,
            time: utils.GetTimestamp(),
            resourcesAreReady: false,
            answers: [],
            correctAnswers: [],
            score: 0
        };

        if (In.Document.player1 == undefined)
        {
            In.Document.player1 = player;
            return true;
        }
        else if (In.Document.player2 == undefined)
        {
            In.Document.player2 = player;
            return true;
        }

        return false;
    }

    // Getters
    this.GetID = function()
    {
        return In.Document.id;
    }

    this.GetTopic = function()
    {
        return In.Document.topic;
    }

    this.GetPublicData = function()
    {
        function removeCorrectAnswerInfo()
        {
            var copyOfQuestions = [];

            for (var i = 0; i < In.Document.questions.length; i++)
            {
                copyOfQuestions.push(
                {
                    id: In.Document.questions[i].id,
                    body: In.Document.questions[i].body,
                    imageUrl: In.Document.questions[i].imageUrl,
                    topic: In.Document.questions[i].topic,
                    answers: In.Document.questions[i].answers
                });
            }

            return copyOfQuestions;
        }

        return {
            id: In.Document.id,
            questions: removeCorrectAnswerInfo(),
            topic: In.Document.topic,
            player1: In.Document.player1,
            player2: In.Document.player2
        };
    }

    this.Push = function(callback)
    {
        DB.collection('games').findOne(
        {
            id: In.Document.id
        }, function(err, existed)
        {
            if (err)
                throw err;

            if (existed)
            {
                DB.collection('games').update(
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
                DB.collection('games').insert(
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
        DB.collection('games').findOne(
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

    this.AreResourcesReady = function()
    {
        return In.Document.player1.resourcesAreReady && In.Document.player2.resourcesAreReady;
    }

    this.SetPlayerIsReady = function(playerID, callback)
    {
        var playerKey;

        // if requested player is player1
        if (playerID == In.Document.player1.id)
        {
            playerKey = "player1";
        }
        else if (playerID == In.Document.player2.id)
        {
            playerKey = "player2";
        }
        else
        {
            callback(false);
            return;
        }

        // update resourcesAreReady field if it is false
        if (!In.Document[playerKey].resourcesAreReady)
        {
            // create an update request
            In.Document[playerKey].resourcesAreReady = true;

            var update = {
                $set:
                {}
            };

            update.$set[playerKey] = In.Document[playerKey];

            DB.collection('games').update(
                {
                    id: In.Document.id
                },
                update,
                function(err)
                {
                    if (err)
                        throw err;

                    callback(true);
                }
            );
        }
        else
        {
            callback(true);
        }
    }

    this.GetQuestionByID = function(questionID)
    {
        for (var i = 0; i < In.Document.questions.length; i++)
            if (In.Document.questions[i].id == questionID)
                return In.Document.questions[i];

        return undefined;
    }

    this.GetPlayerObjectByID = function(playerID)
    {
        if (In.Document.player1.id == playerID)
        {
            return In.Document.player1;
        }
        else if (In.Document.player2.id == playerID)
        {
            return In.Document.player2;
        }
        else
        {
            throw new Error('Player is not in the game. Use IsPlayerInTheGame method before IsQuestionAnswered.');
        }
    }

    this.IsPlayerInTheGame = function(playerID)
    {
        if (In.Document.player1.id == playerID)
        {
            return true;
        }
        else if (In.Document.player2.id == playerID)
        {
            return true;
        }

        return false;
    }

    this.IsQuestionAnswered = function(questionID, playerID)
    {
        var playerObject = In.GetPlayerObjectByID(playerID);

        for (var i = 0; i < playerObject.answers.length; i++)
        {
            if (playerObject.answers[i].id == questionID)
                return true;
        }

        return false;
    }

    this.Answer = function(questionID, answerID, playerID, callback)
    {
        var question = In.GetQuestionByID(questionID);
        var playerObject = In.GetPlayerObjectByID(playerID);
        var answerIsCorrect = false;

        // push a new answer
        playerObject.answers.push(
        {
            question_id: questionID,
            answer_id: answerID
        });

        // push correct answer
        playerObject.correctAnswers.push(
        {
            question_id: questionID,
            answer_id: question.correctAnswer
        });

        // if answer is correct
        if (parseInt(answerID) == parseInt(question.correctAnswer))
        {
            // update score
            playerObject.score += 1;

            // update flag
            answerIsCorrect = true;
        }

        // update player object
        In.PushAnswersForPlayer(playerID, playerObject, answerIsCorrect, callback);

        // update time
        In.UpdateTimeOfLastAction();
    }

    this.PushAnswersForPlayer = function(playerID, playerObject, answerIsCorrect, callback)
    {
        // update player object
        var setObject = {
            $set:
            {

            }
        };

        if (In.Document.player1.id == playerID)
        {
            setObject.$set.player1 = playerObject;
        }
        else if (In.Document.player2.id == playerID)
        {
            setObject.$set.player2 = playerObject;
        }
        else
        {
            throw new Error('Player is not in the game. Use IsPlayerInTheGame method before IsQuestionAnswered.');
        }

        DB.collection('games').update(
            {
                id: In.Document.id
            },
            setObject,
            function(err)
            {
                if (err)
                    throw err;

                callback(answerIsCorrect);
            }
        );
    }

    this.UpdateTimeOfLastAction = function()
    {
        DB.collection('games').update(
            {
                id: In.Document.id
            },
            {
                $set:
                {
                    timeOfLastAction: Date.now()
                }
            },
            function(err)
            {
                if (err)
                    throw err;
            }
        );
    }

    this.SkipQuestion = function(questionID, playerID, callback)
    {
        var question = In.GetQuestionByID(questionID);
        var playerObject = In.GetPlayerObjectByID(playerID);

        // push a new answer
        playerObject.answers.push(
        {
            question_id: questionID,
            answer_id: -1
        });

        // push correct answer
        playerObject.correctAnswers.push(
        {
            question_id: questionID,
            answer_id: question.correctAnswer
        });

        In.Document.timeOfLastAction = Date.now();

        In.Push(function()
        {
            callback();
        });
    }

    this.IsFinished = function()
    {
        return In.Document.player1.answers.length == In.Document.questions.length &&
            In.Document.player2.answers.length == In.Document.questions.length;
    }

    this.GetResult = function()
    {
        if (In.Document.player1.score == In.Document.player2.score)
            return 0;

        if (In.Document.player1.score > In.Document.player2.score)
            return 1;

        if (In.Document.player1.score < In.Document.player2.score)
            return -1;
    }

    this.GetWinner = function()
    {
        if (In.GetResult() == 1)
            return In.Document.player1;

        if (In.GetResult() == -1)
            return In.Document.player2;

        return undefined;
    }

    this.AreBothPlayersReadyForNextQuestion = function()
    {
        return In.Document.player1.answers.length == In.Document.player2.answers.length;
    }
}
