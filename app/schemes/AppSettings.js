exports.AppSettings = function()
{
    var In = this; // instance

    this.Document = {
        id: 1,
        requiredNumberOfTopics: 3,
        numberOfQuestionsInGame: 5
    }

    this.IsInstantiated = false;

    this.GetNumberOfTopics = function()
    {
        return In.Document.requiredNumberOfTopics;
    }

    this.SetNumberOfTopics = function(topicsNumber)
    {
        In.Document.requiredNumberOfTopics = topicsNumber;
    }

    this.GetNumberOfQuestionsInGame = function()
    {
        return In.Document.numberOfQuestionsInGame;
    }

    this.SetNumberOfQuestionsInGame = function(questionsNumber)
    {
        In.Document.numberOfQuestionsInGame = questionsNumber;
    }

    this.GetPublicData = function()
    {
        return {
            requiredNumberOfTopics: In.Document.requiredNumberOfTopics,
            numberOfQuestionsInGame: In.Document.numberOfQuestionsInGame
        };
    }

    this.Push = function(callback)
    {
        DB.collection('app_settings').findOne(
        {
            id: In.Document.id
        }, function(err, existed)
        {
            if (err)
                throw err;

            if (existed)
            {
                DB.collection('app_settings').update(
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
                DB.collection('app_settings').insert(
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
        DB.collection('app_settings').findOne(
        {
            id: In.Document.id
        }, function(err, result)
        {
            if (err)
                throw err;

            if (result)
            {
                if (!result.hasOwnProperty("numberOfQuestionsInGame") || result.numberOfQuestionsInGame <= 0)
                {
                    // set default value
                    result.numberOfQuestionsInGame = 3;
                }

                In.Document = result;

                In.IsInstantiated = true;

                callback(true, In);
            }
            else
            {
                In.Push(function()
                {
                    callback(true, In);
                });
            }
        });
    }
}
