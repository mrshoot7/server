exports.response = function(res, id)
{
    var errors = {
        1: 'TOKEN_IS_NOT_VALID',
        2: 'PLAYER_NOT_FOUND',
        3: 'PLAYER_ALREADY_EXISTS',
        4: 'APP_KEY_IS_NOT_VALID',
        5: 'PLAYERS_IS_NOT_IN_A_GAME',
        6: 'GAME_ID_IS_NOT_VALID',
        7: 'OPPONENT_NOT_FOUND',
        8: 'QUESTION_IS_NOT_IN_A_GAME',
        9: 'PLAYER_FROM_GAME_IS_NOT_FOUND',
        10: 'TOPIC_IS_NOT_FOUND',
        11: 'QUESTIONS_NOT_FOUND'
    };

    // send an error if we've not found a player with the requested data
    res.send(
    {
        error:
        {
            id: id,
            message: errors[id]
        }
    });
}
