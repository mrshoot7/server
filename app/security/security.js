var sha256 = require("js-sha256");

exports.Security = {
    RequestIsValid: function(req, res)
    {
        var errors = require(__base + 'errors');

        var order = req.get("Order").split(",");
        var originString = req.get("Date");

        for (var i = 0; i < order.length; i++)
        {
            originString += req.body[order[i]];
        }

        var hash = sha256(originString);

        if (req.body.hash != hash)
        {
            errors.response(res, 4);

            return false;
        }
        else
        {
            return true;
        }
    }
}
