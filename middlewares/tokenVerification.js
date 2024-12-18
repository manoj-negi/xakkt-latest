let jwt = require('jsonwebtoken');
var moment = require('moment-timezone');
const User = require('../models/user');


let checkToken = (req, res, next) => { 
  let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase

  if (token) {
    if (token.startsWith(process.env.JWT_SECRET)) {
          token = token.slice(7, token.length);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        
        return res.json({
          success: false,
          message: 'Token is not valid'
        });
      } else {
      //  User.findOne({_id:decoded.id}).populate('_timezone').select('abbr').exec(function (err, story) {
      //    var date = moment.tz.setDefault(story._timezone.abbr);
      //    req._timezone = date
       
      //  })
      }
      req.decoded = decoded;
      next();
    });
  } else {
    return res.json({
      success: false,
      message: 'Auth token is not supplied'
    });
  }
};

module.exports = {
  checkToken: checkToken
};