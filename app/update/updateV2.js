exports.Update = {
    Run: function()
    {
        updateTopics(function()
        {
            updateAnswers();
        });

        function updateAnswers()
        {
            console.log("\n===== Start an update of answers");

            var answersUpdated = 0;

            DB.collection("questions").find(
            {

            }).toArray(function(err, questions)
            {
                if (err)
                    throw err;

                if (questions.length > 0)
                {
                    updateQuestion(questions[0], 0);

                    function updateQuestion(question, index)
                    {
                        var update = false;

                        for (var i = 0; i < question.answers.length; i++)
                        {
                            if (!question.answers[i].hasOwnProperty("id"))
                            {
                                question.answers[i].id = i;
                                answersUpdated++;
                                update = true;
                            }
                        }

                        if (update)
                        {
                            DB.collection("questions").update(
                                {
                                    id: question.id
                                },
                                {
                                    $set:
                                    {
                                        answers: question.answers
                                    }
                                },
                                function(err)
                                {
                                    if (err)
                                        throw err;

                                    if (questions.length > index + 1)
                                    {
                                        updateQuestion(questions[index + 1], index + 1);
                                    }
                                    else
                                    {
                                        console.log(answersUpdated + " answers are updated");
                                        console.log("===== The update of answers is finished\n");
                                    }
                                });
                        }
                        else
                        {
                            if (questions.length > index + 1)
                            {
                                updateQuestion(questions[index + 1], index + 1);
                            }
                            else
                            {
                                console.log(answersUpdated + " answers are updated");
                                console.log("===== The update of answers is finished\n");
                            }
                        }
                    }
                }
                else
                {
                    console.log("No answers to update");
                    console.log("===== The update of answers is finished\n");
                }
            });
        }

        function updateTopics(callback)
        {
            console.log("\n===== Start an update of topics");

            var questionsUpdated = 0;

            DB.collection("questions").find(
            {
                topic:
                {
                    $exists: true
                }
            }).toArray(function(err, questions)
            {
                if (err)
                    throw err;

                if (questions.length > 0)
                {
                    updateQuestion(questions[0], 0);

                    function updateQuestion(question, index)
                    {
                        DB.collection("questions").update(
                            {
                                id: question.id
                            },
                            {
                                $set:
                                {
                                    topicId: question.topic.id
                                },
                                $unset:
                                {
                                    topic: ""
                                }
                            },
                            function(err)
                            {
                                if (err)
                                    throw err;

                                questionsUpdated++;

                                if (questions.length > index + 1)
                                {
                                    updateQuestion(questions[index + 1], index + 1);
                                }
                                else
                                {
                                    console.log(questionsUpdated + " questions are updated");
                                    console.log("===== The update of topics is finished\n");

                                    callback();
                                }
                            });
                    }
                }
                else
                {
                    console.log("No questions to update");
                    console.log("===== The update of topics is finished\n");

                    callback();
                }
            });
        }
    }
}
