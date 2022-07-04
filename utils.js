exports.GetEmptyResponse = function()
{
    return {
        error:
        {
            id: 0,
            message: ""
        }
    };
}

exports.GetTimestamp = function()
{
    return Date.now();
}

exports.GenerateToken = function()
{
    var crypto = require('crypto');
    var current_date = (new Date()).valueOf().toString();
    var random = Math.random().toString();

    return crypto.createHash('sha1').update(current_date + random).digest('hex');
}

exports.GenerateID = function()
{
    return exports.GenerateToken() + exports.GetTimestamp();
}

exports.RandomIntInRange = function(min, max)
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// a function merges two arrays and returns a new one with unique elements from both
exports.MergeArrays = function(array1, array2)
{
    var array = array1.concat(array2);

    var a = array.concat();

    for (var i = 0; i < a.length; ++i)
        for (var j = i + 1; j < a.length; ++j)
            if (a[i] === a[j])
                a.splice(j--, 1);

    return a;
}
