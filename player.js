var auth = require(__base + 'app/app_actions/auth');
var topicActions = require(__base + 'app/app_actions/topic_actions');
var appData = require(__base + 'app/data/app_data');
var playerData = require(__base + 'app/data/player_data');
var gameInitialization = require(__base + 'app/game_process/game_initialization');
var gameActions = require(__base + 'app/game_process/game_actions');

exports.Initialize = function(app)
{
    console.log("\n===== Player module initialization is started");

    auth.Initialize(app);
    appData.Initialize(app);
    playerData.Initialize(app);
    topicActions.Initialize(app);
    gameInitialization.Initialize(app);
    gameActions.Initialize(app);

    console.log("===== Player module is initialized\n");
}
